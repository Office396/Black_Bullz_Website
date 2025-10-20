import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:async';
import 'dart:math';
import 'package:url_launcher/url_launcher.dart';
// Add this after your imports and before the SurveyAutomationApp class
class YouTubeChannel {
  String url;
  String adrinoId;

  YouTubeChannel({required this.url, required this.adrinoId});

  Map<String, dynamic> toMap() {
    return {
      'url': url,
      'adrinoId': adrinoId,
    };
  }

  factory YouTubeChannel.fromMap(Map<String, dynamic> map) {
    return YouTubeChannel(
      url: map['url'],
      adrinoId: map['adrinoId'],
    );
  }
}

const String _surveyHelperJs = r'''
  (function() {
    try {
      // Minimal survey helper - prevents page freeze
      
      // Simple window.open override
      window.open = function(url, name, specs) {
        if (url) window.location.href = String(url);
        return null;
      };
      
      // Fix target=_blank links
      setTimeout(function() {
        document.querySelectorAll('a[target="_blank"], a[target="_new"]').forEach(function(a) {
          a.setAttribute('target','_self');
        });
      }, 1000);
  
      // Simple click helper
      function simpleClick(el) {
        if (!el || !el.offsetParent) return false;
        try {
          el.click();
          return true;
        } catch(e) { return false; }
      }
  
      // Basic popup closer - less aggressive
      function closeBasicPopups() {
        var closeSelectors = ['.close', '.modal-close', '[aria-label="close"]'];
        closeSelectors.forEach(function(sel) {
          try {
            var els = document.querySelectorAll(sel);
            for (var i = 0; i < Math.min(els.length, 3); i++) { // Limit to 3 elements
              if (els[i].offsetParent) simpleClick(els[i]);
            }
          } catch(e) {}
        });
      }
  
      // Simple button finder - less aggressive
      function findSimpleButtons() {
        var patterns = ['continue', 'proceed', 'get link', 'verify'];
        var buttons = document.querySelectorAll('button, input[type="submit"], a');
        
        for (var i = 0; i < Math.min(buttons.length, 10); i++) { // Limit search
          var btn = buttons[i];
          var txt = (btn.textContent || btn.value || '').toLowerCase().trim();
          
          for (var j = 0; j < patterns.length; j++) {
            if (txt.includes(patterns[j]) && btn.offsetParent) {
              if (simpleClick(btn)) return true;
            }
          }
        }
        return false;
      }
  
      // Single execution with timeout
      var executed = false;
      setTimeout(function() {
        if (!executed) {
          executed = true;
          closeBasicPopups();
          findSimpleButtons();
        }
      }, 2000);
      
      // Stop all activity after 30 seconds to prevent freeze
      setTimeout(function() {
        // Clear any remaining intervals/observers
        executed = true;
      }, 30000);
      
    } catch(e) {
      // Fail silently
    }
  })();
''';

/// Sends the MacroDroid broadcast to toggle airplane mode.
class AirplaneMacro {
  /// Broadcast‐to‐MacroDroid channel
  static const _chan = MethodChannel('survey_automation/macro');

  /// Read‐state channel (added!)
  static const _stateChan = MethodChannel('survey_automation/macro_state');

  /// Sends the MacroDroid broadcast; true if broadcast was sent.
  static Future<bool> toggle() async {
    return await _chan.invokeMethod<bool>('triggerMacro') ?? false;
  }

  /// Queries Android for the actual Airplane Mode ON/OFF.
  static Future<bool> getState() async {
    return await _stateChan.invokeMethod<bool>('getAirplaneState') ?? false;
  }
}

/// Fetches the YouTube description for [videoId] using a public Invidious API.
Future<String> fetchVideoDescription(String videoId) async {
  const instances = [
    'https://yewtu.be',
    'https://yewtu.eu',
    'https://yewtu.herokuapp.com'
  ];
  for (final base in instances) {
    final uri = Uri.parse('$base/api/v1/videos/$videoId');
    final resp = await http.get(uri);
    if (resp.statusCode == 200) {
      final data = json.decode(resp.body) as Map<String, dynamic>;
      return data['description'] as String? ?? '';
    }
    if (resp.statusCode != 429) {
      throw Exception('Description lookup failed (${resp.statusCode})');
    }
    // else rate‑limited, try next
  }
  throw Exception('All Invidious instances rate‑limited');
}


/// Extracts all HTTP/HTTPS links from [text].
List<String> extractUrls(String text) {
  final regex = RegExp(r'https?://\S+');
  return regex
      .allMatches(text)
      .map((m) => m.group(0)!)
      .toSet()      // remove duplicates
      .toList();
}

void main() {
  runApp(SurveyAutomationApp());
}

class SurveyAutomationApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Survey Automation',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        visualDensity: VisualDensity.adaptivePlatformDensity,
      ),
      home: MainScreen(),
    );
  }
}

class MainScreen extends StatefulWidget {
  @override
  _MainScreenState createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> with WidgetsBindingObserver {
  final TextEditingController _countController = TextEditingController();
  final TextEditingController _adrinoIdController = TextEditingController();
  final TextEditingController _youtubeController = TextEditingController();
  final TextEditingController _linkCountController = TextEditingController();
  List<YouTubeChannel> _youtubeChannels = [];
  bool _isRunning = false;
  String _status = "Ready to start";
  List<String> _logs = [];
  int _currentYoutubeIndex = 0;
  Map<String, int> _linkCompletions = {};
  Map<String, List<Map<String, dynamic>>> _extractedLinksByVideo = {};

  // Add these new variables for better state management
  int _currentChannelIndex = 0;
  bool _isProcessingChannel = false;
  Map<String, DateTime> _lastChannelProcessTime = {};

  // Live monitoring variables
  late WebViewController _webController;
  String _currentIP = "Detecting...";
  String _currentStep = "Idle";
  int _currentCycle = 0;
  int _totalCycles = 0;

  String _currentUrl = "";
  List<Map<String, dynamic>> _extractedLinks = [];
  Map<String, int> _surveyTypeStats = {
    'adrinolinks': 0,
    'gplinks': 0,
    'v2links': 0,
    'unknown': 0
  };
  int _currentLinkIndex = 0;
  Set<String> _usedIPs = {};
  Timer? _automationTimer;
  bool _showWebView = false;
  bool _airplaneModeAvailable = false;
  bool _macroDroidLinked = false;

  // Survey specific variables
  String _currentSurveyType = "";
  int _currentSurveyStep = 0;
  int _retryCount = 0;
  static const int MAX_RETRIES = 3;

// Ad Blocker Integration Variables
  bool _adBlockerLoaded = false;
  Map<String, dynamic> _adBlockerStats = {
    'removedAds': 0,
    'blockedRedirects': 0,
    'clickedButtons': 0
  };
  String _adBlockerScript = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initializeWebView();
    _loadAdBlockerScript();
    _loadSavedData();
    _loadUsedIPs();
    _loadInputData(); // Add this line
    _getCurrentIP();
    _checkAirplaneModeSupport();
    _checkMacroDroidSetup();
    _initializeState();
    // Add listener to save when cycle count changes
    _countController.addListener(() {
      _saveInputData();
    });
  }

  void _initializeState() {
    _currentChannelIndex = 0;
    _isProcessingChannel = false;
    _currentLinkIndex = 0;
    _extractedLinks.clear();
  }

  /// Checks that MacroDroid is installed and the broadcast is linked.
  Future<void> _checkMacroDroidSetup() async {
    try {
      // Probe without toggling
      final _ = await AirplaneMacro.getState();
      setState(() => _macroDroidLinked = true);
      _addLog("🔗 MacroDroid link: OK");
    } catch (e) {
      setState(() => _macroDroidLinked = false);
      _addLog("❌ MacroDroid check failed: $e");
    }
  }

  /// Opens MacroDroid in the Play Store so the user can link the macro.
  Future<void> _openMacroDroidSettings() async {
    const storeUrl = 'market://details?id=com.arlosoft.macrodroid';
    if (await canLaunch(storeUrl)) {
      await launch(storeUrl);
    } else {
      await launch(
          'https://play.google.com/store/apps/details?id=com.arlosoft.macrodroid'
      );
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _automationTimer?.cancel();
    _saveProgress();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused) {
      _saveProgress();
    } else if (state == AppLifecycleState.resumed) {
      _loadSavedData();
    }
  }

  Future<void> _checkAirplaneModeSupport() async {
    try {
      const platform = MethodChannel('survey_automation/airplane_mode');
      bool isSupported = await platform.invokeMethod('isSupported');
      setState(() {
        _airplaneModeAvailable = isSupported;
      });
      _addLog("✈ Airplane mode support: ${isSupported
          ? 'Available'
          : 'Not Available'}");
    } catch (e) {
      setState(() {
        _airplaneModeAvailable = false;
      });
      _addLog("❌ Airplane mode not supported: $e");
    }
  }

// Enhanced WebView initialization with stealth features
  void _initializeWebView() {
    _webController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0x00000000))
      ..setUserAgent(
          'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Mobile Safari/537.36')
      ..setNavigationDelegate(
        NavigationDelegate(
          onNavigationRequest: (request) {
            final uri = Uri.tryParse(request.url);
            if (uri != null) {
              // Block only problematic schemes, allow all HTTP/HTTPS
              if (uri.scheme == 'intent' || uri.scheme == 'market' ||
                  uri.scheme == 'mailto' || uri.scheme == 'tel') {
                return NavigationDecision.prevent;
              }
            }
            _addLog('🔗 Navigation to: ${request.url}');
            return NavigationDecision.navigate;
          },
          onPageFinished: (url) async {
            _addLog('✅ Page finished: $url');
            try {
              // Wait for page to stabilize before any injection
              await Future.delayed(Duration(seconds: 1));

              // Inject advanced stealth features
              await _injectAdvancedStealthFeatures();

              // Simple dialog blocker only
              await _injectDialogBlockerComplete();

              // Wait more before page analysis
              await Future.delayed(Duration(seconds: 2));

              // Simple page handler
              await _handlePageIntelligently(url);

              // Inject helper script with delay
              await Future.delayed(Duration(seconds: 1));
              await _webController.runJavaScript(_surveyHelperJs);
            } catch (e) {
              _addLog('JS injection failed: $e');
            }
          },
          onWebResourceError: (err) {
            _addLog('Web error: ${err.description}');
          },
        ),
      );

    // Load blank page and immediately inject dialog blocker
    _webController.loadRequest(Uri.parse('about:blank')).then((_) {
      _injectDialogBlockerEarly();
    });
  }

// Advanced stealth features injection
  Future<void> _injectAdvancedStealthFeatures() async {
    try {
      await _webController.runJavaScript('''
      (function() {
        // Canvas fingerprinting protection
        const originalGetContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function() {
          const context = originalGetContext.apply(this, arguments);
          if (context && context.canvas) {
            // Add canvas noise
            const imageData = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
            for (let i = 0; i < imageData.data.length; i += 4) {
              // Subtle noise
              imageData.data[i] += Math.floor(Math.random() * 3) - 1;
              imageData.data[i + 1] += Math.floor(Math.random() * 3) - 1;
              imageData.data[i + 2] += Math.floor(Math.random() * 3) - 1;
            }
            context.putImageData(imageData, 0, 0);
          }
          return context;
        };

        // WebGL fingerprinting protection
        const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
        WebGLRenderingContext.prototype.getParameter = function() {
          const param = originalGetParameter.apply(this, arguments);
          // Spoof WebGL parameters slightly
          if (arguments[0] === 37445) { // UNMASKED_VENDOR_WEBGL
            return "Google Inc. (NVIDIA)";
          }
          if (arguments[0] === 37446) { // UNMASKED_RENDERER_WEBGL
            return "NVIDIA GeForce GTX 1060 OpenGL Engine";
          }
          return param;
        };

        // Font fingerprinting protection
        const originalMeasureText = CanvasRenderingContext2D.prototype.measureText;
        CanvasRenderingContext2D.prototype.measureText = function() {
          const result = originalMeasureText.apply(this, arguments);
          // Slightly modify text metrics
          result.width += Math.random() * 2 - 1;
          return result;
        };

        // WebRTC protection
        const originalGetUserMedia = navigator.mediaDevices.getUserMedia;
        navigator.mediaDevices.getUserMedia = function() {
          return Promise.reject(new Error('Permission denied'));
        };

        // Hardware concurrency spoofing
        Object.defineProperty(navigator, 'hardwareConcurrency', {
          value: 4,
          configurable: false,
          enumerable: true,
          writable: false
        });

        // Platform spoofing
        Object.defineProperty(navigator, 'platform', {
          value: 'Linux armv81',
          configurable: false,
          enumerable: true,
          writable: false
        });

        // Device memory spoofing
        Object.defineProperty(navigator, 'deviceMemory', {
          value: 4,
          configurable: false,
          enumerable: true,
          writable: false
        });

        // Language spoofing
        Object.defineProperty(navigator, 'language', {
          value: 'en-US',
          configurable: false,
          enumerable: true,
          writable: false
        });

        Object.defineProperty(navigator, 'languages', {
          value: ['en-US', 'en'],
          configurable: false,
          enumerable: true,
          writable: false
        });

        // Timezone spoofing
        Object.defineProperty(Intl.DateTimeFormat.prototype, 'resolvedOptions', {
          value: function() {
            const result = Intl.DateTimeFormat.prototype.resolvedOptions.apply(this, arguments);
            result.timeZone = 'America/New_York';
            return result;
          },
          configurable: false,
          enumerable: true,
          writable: false
        });

        // Screen resolution spoofing
        Object.defineProperty(screen, 'width', {
          value: 360,
          configurable: false,
          enumerable: true,
          writable: false
        });

        Object.defineProperty(screen, 'height', {
          value: 640,
          configurable: false,
          enumerable: true,
          writable: false
        });

        Object.defineProperty(screen, 'availWidth', {
          value: 360,
          configurable: false,
          enumerable: true,
          writable: false
        });

        Object.defineProperty(screen, 'availHeight', {
          value: 640,
          configurable: false,
          enumerable: true,
          writable: false
        });

        Object.defineProperty(screen, 'colorDepth', {
          value: 24,
          configurable: false,
          enumerable: true,
          writable: false
        });

        Object.defineProperty(screen, 'pixelDepth', {
          value: 24,
          configurable: false,
          enumerable: true,
          writable: false
        });

        // Plugin spoofing
        const originalPlugins = Array.from(navigator.plugins);
        Object.defineProperty(navigator, 'plugins', {
          get: function() {
            return originalPlugins;
          },
          configurable: false,
          enumerable: true
        });

        // MIME type spoofing
        const originalMimeTypes = Array.from(navigator.mimeTypes);
        Object.defineProperty(navigator, 'mimeTypes', {
          get: function() {
            return originalMimeTypes;
          },
          configurable: false,
          enumerable: true
        });

        // Prevent WebRTC IP leakage
        const originalRTCPeerConnection = window.RTCPeerConnection;
        window.RTCPeerConnection = function() {
          const pc = new originalRTCPeerConnection(arguments);
          // Modify ICE candidate generation to exclude private IPs
          const originalAddIceCandidate = pc.addIceCandidate;
          pc.addIceCandidate = function(candidate) {
            if (candidate && candidate.candidate && 
                (candidate.candidate.includes('192.168.') || 
                 candidate.candidate.includes('172.') ||
                 candidate.candidate.includes('10.') ||
                 candidate.candidate.includes('localhost') ||
                 candidate.candidate.includes('127.0.0.1'))) {
              return Promise.reject(new Error('Invalid candidate'));
            }
            return originalAddIceCandidate.apply(this, arguments);
          };
          return pc;
        };

        console.log('✅ Advanced stealth features activated');
      })();
    ''');
      _addLog('🛡️ Advanced stealth features injected');
    } catch (e) {
      _addLog('⚠️ Advanced stealth injection failed: $e');
    }
  }

// Humanized delays with randomization
  Future<void> _humanizedDelay({int minSeconds = 2, int maxSeconds = 5}) async {
    final random = Random();
    final delay = minSeconds + random.nextInt(maxSeconds - minSeconds + 1);
    _addLog("⏱ Humanized delay: $delay seconds");
    await Future.delayed(Duration(seconds: delay));
  }

// Simulate human mouse movements
  Future<void> _simulateHumanInteractions() async {
    try {
      await _webController.runJavaScript('''
      (function() {
        // Simulate random mouse movements
        const moves = 5 + Math.floor(Math.random() * 10);
        for (let i = 0; i < moves; i++) {
          setTimeout(() => {
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight;
            const event = new MouseEvent('mousemove', {
              view: window,
              bubbles: true,
              cancelable: true,
              clientX: x,
              clientY: y
            });
            document.dispatchEvent(event);
          }, i * 200);
        }

        // Simulate occasional scrolling
        setTimeout(() => {
          window.scrollBy({
            top: Math.random() * 500 - 250,
            left: 0,
            behavior: 'smooth'
          });
        }, 1000);

        console.log('👤 Simulated human interactions');
      })();
    ''');
    } catch (e) {
      _addLog('⚠️ Human interaction simulation failed: $e');
    }
  }
  List<Map<String, dynamic>> _completionSequence = [];
// Enhanced survey processing with human behavior
  Future<bool> _processSurveyWithHumanBehavior(
      Map<String, dynamic> linkData) async {
    final String link = linkData['url'];
    final String surveyType = linkData['surveyType'];
    final String displayName = linkData['displayName'];

    for (_retryCount = 0; _retryCount < MAX_RETRIES; _retryCount++) {
      try {
        _addLog("🔄 Attempt ${_retryCount +
            1}/$MAX_RETRIES for [$displayName] $link");

        // First navigate to YouTube as referrer
        await _navigateToYouTube();
        await _humanizedDelay(minSeconds: 2, maxSeconds: 4);

        // Then navigate to survey link with enhanced protection
        await _navigateToSurveyLink(link);

        // Simulate human interactions
        await _simulateHumanInteractions();
        await _humanizedDelay(minSeconds: 1, maxSeconds: 3);

        // Handle any navigation dialogs that might appear
        await _handleNavigationDialogs();

        // Inject ad blocker before interacting with the page
        try {
          await _injectAdBlocker();
          await _humanizedDelay(minSeconds: 1, maxSeconds: 2);

          // Best-effort call to remove existing ads/popups
          try {
            await _webController.runJavaScript(
                'window.flutterSurveyAdBlocker && window.flutterSurveyAdBlocker.removeExistingAds && window.flutterSurveyAdBlocker.removeExistingAds();');
          } catch (_) {}

          // Refresh stats
          await _getAdBlockerStats();
        } catch (e) {
          _addLog("⚠️ Ad blocker injection failed (continuing): $e");
        }

        // Determine survey type and process accordingly
        _currentSurveyType = surveyType;
        _addLog("📊 Survey type detected: $_currentSurveyType ($displayName)");

        // Continue with existing processing functions with humanized delays
        bool success = await _processSurveyByType(link);

        if (success) {
          return true;
        }

        _addLog("❌ Attempt ${_retryCount + 1} failed, retrying...");
        await _humanizedDelay(minSeconds: 3, maxSeconds: 7);
      } catch (e) {
        _addLog("❌ Error in attempt ${_retryCount + 1}: $e");
        await _humanizedDelay(minSeconds: 2, maxSeconds: 5);
      }
    }
    return false;
  }

// Early dialog blocker - runs immediately when page starts
// In the _injectDialogBlockerEarly method
  void _injectDialogBlockerEarly() {
    try {
      _webController.runJavaScript('''
    // Minimal, non-blocking dialog handling
    (function() {
      if (!window._dialogsBlocked) {
        // Store originals
        window._originalAlert = window.alert;
        window._originalConfirm = window.confirm;
        window._originalPrompt = window.prompt;
        
        // Simple overrides without complex logic
        window.alert = function(msg) { 
          return true; 
        };
        
        window.confirm = function(msg) { 
          return true;
        };
        
        window.prompt = function(msg, def) { 
          return def || 'ok'; 
        };
        
        // Simple beforeunload handling
        window.onbeforeunload = null;
        
        window._dialogsBlocked = true;
      }
    })();
  ''');
    } catch (e) {
      // Silently continue if injection fails at this stage
    }
  }

  Future<void> _handlePageIntelligently(String url) async {
    try {
      _addLog(
          '🧠 Simple page analysis: ${url.length > 80 ? url.substring(0, 80) +
              '...' : url}');

      // Longer wait to let page stabilize
      await Future.delayed(Duration(seconds: 2));

      // Simplified page analysis
      Object? pageAnalysis = await _webController.runJavaScriptReturningResult(
          '''
    (function() {
      try {
        var bodyText = document.body ? (document.body.textContent || document.body.innerText || '') : '';
        var url = window.location.href;
        
        var isRedirectingPage = bodyText.includes('Redirecting') || bodyText.includes('click here');
        var isCloudflare = bodyText.includes('Verifying you are human') || bodyText.includes('CLOUDFLARE');
        var isProcinehub = url.includes('procinehub');
        
        return JSON.stringify({
          bodyLength: bodyText.length,
          isRedirectingPage: isRedirectingPage,
          isCloudflare: isCloudflare,
          isProcinehub: isProcinehub,
          url: url
        });
      } catch(e) {
        return JSON.stringify({error: e.toString()});
      }
    })();
  ''');

      String analysisStr = pageAnalysis?.toString() ?? '{}';
      _addLog('🔍 Analysis result: $analysisStr');

      // Simple handling - less aggressive
      if (analysisStr.contains('"isCloudflare":true')) {
        _addLog('🛡 Cloudflare detected - waiting...');
        await Future.delayed(Duration(seconds: 5));
      } else if (analysisStr.contains('"isRedirectingPage":true')) {
        _addLog('🔄 Redirect page - waiting for auto-redirect...');
        await Future.delayed(Duration(seconds: 3));
      } else {
        _addLog('📄 Standard page - continuing...');
      }
    } catch (e) {
      _addLog('❌ Page handler error: $e');
    }
  }

// Add these methods to your _MainScreenState class
  List<TextEditingController> _youtubeLinkControllers = [
    TextEditingController()
  ];

  List<String> get _youtubeLinks =>
      _youtubeLinkControllers
          .map((controller) => controller.text.trim())
          .where((link) => link.isNotEmpty)
          .toList();

  Future<void> _handleRedirectingPageEnhanced(String analysisStr) async {
    try {
      _addLog('🔄 ENHANCED redirect handling started...');

      // Multiple aggressive redirect strategies
      Object? redirectResult = await _webController
          .runJavaScriptReturningResult('''
      (function() {
        console.log('🚀 AGGRESSIVE REDIRECT HANDLER ACTIVATED');
        
        var redirectSuccess = false;
        
        // STRATEGY 1: Immediate click on ANY visible link containing procinehub
        var procinehubLinks = document.querySelectorAll('a[href*="procinehub"]');
        console.log('Found ' + procinehubLinks.length + ' procinehub links');
        
        for (var i = 0; i < procinehubLinks.length; i++) {
          var link = procinehubLinks[i];
          if (link.offsetParent !== null) {
            console.log('✅ CLICKING PROCINEHUB LINK: ' + link.href);
            link.click();
            redirectSuccess = true;
            break;
          }
        }
        
        // STRATEGY 2: Click any "click here" text aggressively
        if (!redirectSuccess) {
          var allElements = document.querySelectorAll('a, span, div');
          for (var i = 0; i < allElements.length; i++) {
            var el = allElements[i];
            var text = (el.textContent || '').toLowerCase().trim();
            if ((text.includes('click here') || text === 'here') && el.href) {
              console.log('✅ CLICKING HERE LINK: ' + el.href);
              el.click();
              redirectSuccess = true;
              break;
            }
          }
        }
        
        // STRATEGY 3: Force meta refresh execution
        if (!redirectSuccess) {
          var metaRefresh = document.querySelector('meta[http-equiv="refresh"]');
          if (metaRefresh) {
            var content = metaRefresh.getAttribute('content');
            var urlMatch = content.match(/url=([^;]+)/i);
            if (urlMatch && urlMatch[1]) {
              console.log('✅ FORCING META REDIRECT: ' + urlMatch[1]);
              window.location.href = urlMatch[1];
              redirectSuccess = true;
            }
          }
        }
        
        // STRATEGY 4: Execute any redirect JavaScript found in page
        if (!redirectSuccess) {
          var scripts = document.querySelectorAll('script');
          for (var i = 0; i < scripts.length; i++) {
            var script = scripts[i];
            var scriptText = script.textContent || '';
            if (scriptText.includes('location.href') || scriptText.includes('window.location')) {
              try {
                console.log('✅ EXECUTING REDIRECT SCRIPT');
                eval(scriptText);
                redirectSuccess = true;
                break;
              } catch(e) {
                console.log('Script exec failed:', e);
              }
            }
          }
        }
        
        // STRATEGY 5: Force form submission if present
        if (!redirectSuccess) {
          var forms = document.querySelectorAll('form');
          if (forms.length > 0) {
            console.log('✅ SUBMITTING FIRST FORM');
            forms[0].submit();
            redirectSuccess = true;
          }
        }
        
        // STRATEGY 6: Ultimate fallback - reload with force
        if (!redirectSuccess) {
          console.log('🔄 ULTIMATE FALLBACK - RELOADING');
          setTimeout(function() {
            window.location.reload(true);
          }, 1000);
          redirectSuccess = true;
        }
        
        return redirectSuccess ? 'redirect-forced' : 'redirect-failed';
      })();
    ''');

      String resultStr = redirectResult?.toString() ?? 'no-result';
      _addLog('🔄 Enhanced redirect result: $resultStr');

      if (resultStr.contains('forced')) {
        _addLog('✅ Redirect successfully forced, waiting for navigation...');
        await Future.delayed(Duration(seconds: 6));
      } else {
        _addLog('⚠️ Redirect forcing failed, trying page reload...');
        await _webController.reload();
        await Future.delayed(Duration(seconds: 4));
      }
    } catch (e) {
      _addLog('❌ Enhanced redirect error: $e');
    }
  }

  Future<void> _handleCloudflareEnhanced(String analysisStr) async {
    try {
      _addLog('🛡 ENHANCED Cloudflare challenge solver activated...');

      // Persistent Cloudflare solving with multiple attempts
      for (int attempt = 1; attempt <= 8; attempt++) {
        if (!_isRunning) return;

        _addLog('🎯 Cloudflare attempt $attempt/8...');

        Object? solveResult = await _webController.runJavaScriptReturningResult(
            '''
        (function() {
          console.log('🛡 CLOUDFLARE SOLVER ATTEMPT ${attempt}');
          
          var solutionFound = false;
          
          // AGGRESSIVE CHECKBOX CLICKING
          var checkboxes = document.querySelectorAll('input[type="checkbox"]');
          console.log('Found ' + checkboxes.length + ' checkboxes');
          
          for (var i = 0; i < checkboxes.length; i++) {
            var cb = checkboxes[i];
            if (cb.offsetParent !== null && !cb.checked) {
              console.log('✅ AGGRESSIVELY CLICKING CHECKBOX');
              
              // Multiple click methods
              cb.click();
              cb.checked = true;
              
              // Dispatch multiple events
              var events = ['mousedown', 'mouseup', 'click', 'change', 'input'];
              for (var j = 0; j < events.length; j++) {
                try {
                  var event = new Event(events[j], { bubbles: true, cancelable: true });
                  cb.dispatchEvent(event);
                } catch(e) {}
              }
              
              // Also try mouse events
              try {
                var mouseEvent = new MouseEvent('click', {
                  view: window,
                  bubbles: true,
                  cancelable: true,
                  button: 0
                });
                cb.dispatchEvent(mouseEvent);
              } catch(e) {}
              
              solutionFound = true;
              break;
            }
          }
          
          // TURNSTILE WIDGET HANDLING
          if (!solutionFound) {
            var turnstile = document.querySelector('.cf-turnstile');
            if (turnstile) {
              console.log('🎯 TURNSTILE WIDGET FOUND');
              var turnstileInput = turnstile.querySelector('input[type="checkbox"]');
              if (turnstileInput && !turnstileInput.checked) {
                turnstileInput.click();
                solutionFound = true;
              }
            }
          }
          
          // BUTTON VERIFICATION
          if (!solutionFound) {
            var buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"]');
            for (var k = 0; k < buttons.length; k++) {
              var btn = buttons[k];
              var btnText = (btn.textContent || btn.value || '').toLowerCase();
              if (btnText.includes('verify') || btnText.includes('continue') || btnText.includes('proceed')) {
                console.log('✅ CLICKING VERIFY BUTTON: ' + btnText);
                btn.click();
                solutionFound = true;
                break;
              }
            }
          }
          
          // FORCE CLOUDFLARE COMPLETION
          if (!solutionFound) {
            console.log('🔧 FORCING CLOUDFLARE COMPLETION');
            
            // Try Turnstile API if available
            if (window.turnstile && window.turnstile.render) {
              try {
                window.turnstile.render();
                solutionFound = true;
              } catch(e) {}
            }
            
            // Force form submission
            var forms = document.querySelectorAll('form');
            if (forms.length > 0) {
              forms[0].submit();
              solutionFound = true;
            }
          }
          
          return solutionFound ? 'challenge-solved-${attempt}' : 'no-solution-${attempt}';
        })();
      ''');

        String resultStr = solveResult?.toString() ?? 'no-result';
        _addLog('🎯 Attempt $attempt result: $resultStr');

        if (resultStr.contains('solved')) {
          _addLog('✅ Cloudflare challenge solved! Waiting for verification...');
          await Future.delayed(Duration(seconds: 5));

          // Check if we've moved past Cloudflare
          String currentUrl = await _webController.currentUrl() ?? "";
          if (currentUrl.contains('procinehub') &&
              !currentUrl.contains('cloudflare')) {
            _addLog('🎉 Successfully passed Cloudflare verification!');
            return;
          }
        }

        // Wait between attempts
        await Future.delayed(Duration(seconds: 2));
      }

      _addLog('⚠️ Cloudflare solving completed, proceeding anyway...');
    } catch (e) {
      _addLog('❌ Enhanced Cloudflare error: $e');
    }
  }
  Future<void> _loadYouTubeAfterIPChange(String youtubeUrl) async {
    _addLog("🔄 Loading YouTube after IP change...");

    try {
      // Navigate to YouTube URL
      await _webController.loadRequest(Uri.parse(youtubeUrl));

      // Wait for page to start loading
      await Future.delayed(Duration(seconds: 3));

      // Simple check to confirm YouTube is loading
      String currentUrl = await _webController.currentUrl() ?? "";
      if (currentUrl.contains("youtube.com") || currentUrl.contains("youtu.be")) {
        _addLog("✅ YouTube started loading successfully");
      } else {
        _addLog("⚠️ YouTube may not have loaded properly");
      }

      // Wait a bit longer for the page to fully render
      await Future.delayed(Duration(seconds: 3));

    } catch (e) {
      _addLog("❌ Error loading YouTube after IP change: $e");
    }
  }
  Future<void> _handleRedirectingPage(String analysisStr) async {
    try {
      _addLog('🔄 Processing redirecting page...');

      // Multiple strategies to handle redirecting pages
      Object? redirectResult = await _webController
          .runJavaScriptReturningResult('''
      (function() {
        console.log('🔄 Starting redirect handler...');
        
        // Strategy 1: Click "click here" links immediately
        var links = document.querySelectorAll('a[href]');
        for (var i = 0; i < links.length; i++) {
          var link = links[i];
          var linkText = (link.textContent || '').toLowerCase().trim();
          if ((linkText.includes('click here') || linkText.includes('here')) && link.href) {
            console.log('✅ Clicking redirect link: ' + link.href);
            console.log('Link text: ' + linkText);
            link.click();
            return 'link-clicked';
          }
        }
        
        // Strategy 2: Force meta refresh if it exists
        var metaRefresh = document.querySelector('meta[http-equiv="refresh"]');
        if (metaRefresh) {
          var content = metaRefresh.getAttribute('content');
          console.log('🔄 Meta refresh found: ' + content);
          
          // Extract URL from meta refresh
          var urlMatch = content.match(/url=([^;]+)/i);
          if (urlMatch && urlMatch[1]) {
            var redirectUrl = urlMatch[1];
            console.log('🔄 Forcing redirect to: ' + redirectUrl);
            window.location.href = redirectUrl;
            return 'meta-redirect';
          }
        }
        
        // Strategy 3: Look for any form and submit it
        var forms = document.querySelectorAll('form');
        if (forms.length > 0) {
          console.log('📝 Found form, submitting...');
          forms[0].submit();
          return 'form-submitted';
        }
        
        // Strategy 4: Check for JavaScript redirect code and execute
        var scripts = document.querySelectorAll('script');
        for (var i = 0; i < scripts.length; i++) {
          var script = scripts[i];
          if (script.textContent && (script.textContent.includes('location.href') || script.textContent.includes('window.location'))) {
            console.log('🔄 Found redirect script, executing...');
            try {
              eval(script.textContent);
              return 'script-executed';
            } catch(e) {
              console.log('Script execution failed:', e);
            }
          }
        }
        
        // Strategy 5: Force page reload to trigger redirect
        console.log('🔄 No redirect elements found, reloading page...');
        window.location.reload();
        return 'page-reloaded';
      })();
    ''');

      String resultStr = redirectResult?.toString() ?? 'no-result';
      _addLog('🔄 Redirect result: $resultStr');

      if (resultStr.contains('clicked') || resultStr.contains('redirect') ||
          resultStr.contains('submitted')) {
        _addLog('✅ Redirect triggered successfully');
        await Future.delayed(Duration(seconds: 4));
      } else {
        _addLog('⚠️ Redirect may have failed, waiting anyway...');
        await Future.delayed(Duration(seconds: 6));
      }
    } catch (e) {
      _addLog('❌ Error handling redirecting page: $e');
    }
  }

  Future<void> _handleCloudflareIntelligently(String analysisStr) async {
    try {
      _addLog('🛡 Processing Cloudflare verification...');

      // Enhanced Cloudflare solving with multiple strategies
      Object? solveResult = await _webController.runJavaScriptReturningResult(
          '''
      (function() {
        console.log('🛡 Starting Cloudflare challenge solver...');
        
        // Strategy 1: Find and click verification checkbox
        var checkboxes = document.querySelectorAll('input[type="checkbox"]');
        for (var i = 0; i < checkboxes.length; i++) {
          var cb = checkboxes[i];
          if (cb.offsetParent !== null && !cb.checked) {
            console.log('✅ Clicking verification checkbox');
            cb.click();
            cb.checked = true;
            
            // Trigger events
            var events = ['change', 'click', 'input'];
            for (var j = 0; j < events.length; j++) {
              var event = new Event(events[j], { bubbles: true, cancelable: true });
              cb.dispatchEvent(event);
            }
            return 'checkbox-clicked';
          }
        }
        
        // Strategy 2: Cloudflare Turnstile widget
        var turnstile = document.querySelector('.cf-turnstile');
        if (turnstile) {
          console.log('🎯 Found Turnstile widget');
          var turnstileCheckbox = turnstile.querySelector('input[type="checkbox"]');
          if (turnstileCheckbox && !turnstileCheckbox.checked) {
            console.log('✅ Clicking Turnstile checkbox');
            turnstileCheckbox.click();
            return 'turnstile-clicked';
          }
          
          // Try to trigger Turnstile API
          if (window.turnstile && typeof window.turnstile.render === 'function') {
            try {
              console.log('🔧 Triggering Turnstile API');
              window.turnstile.render();
              return 'turnstile-rendered';
            } catch(e) {
              console.log('Turnstile API failed:', e);
            }
          }
        }
        
        // Strategy 3: Click verification buttons
        var buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"]');
        for (var i = 0; i < buttons.length; i++) {
          var btn = buttons[i];
          var btnText = (btn.textContent || btn.value || '').toLowerCase();
          if (btn.offsetParent !== null && (btnText.includes('verify') || btnText.includes('continue') || btnText.includes('proceed'))) {
            console.log('✅ Clicking verification button: ' + btnText);
            btn.click();
            return 'button-clicked';
          }
        }
        
        // Strategy 4: Wait for automatic verification
        console.log('⏳ Waiting for automatic Cloudflare verification...');
        setTimeout(function() {
          // Check again after delay
          var newCheckboxes = document.querySelectorAll('input[type="checkbox"]');
          for (var i = 0; i < newCheckboxes.length; i++) {
            var cb = newCheckboxes[i];
            if (cb.offsetParent !== null && !cb.checked) {
              console.log('🔄 Delayed checkbox click');
              cb.click();
              break;
            }
          }
        }, 3000);
        
        return 'waiting-auto';
      })();
    ''');

      String resultStr = solveResult?.toString() ?? 'no-result';
      _addLog('🛡 Cloudflare result: $resultStr');

      if (resultStr.contains('clicked') || resultStr.contains('rendered')) {
        _addLog('✅ Cloudflare challenge solved, waiting for verification...');
        await Future.delayed(Duration(seconds: 8));
      } else {
        _addLog('⏳ Cloudflare challenge pending, waiting for auto-complete...');
        await Future.delayed(Duration(seconds: 10));
      }
    } catch (e) {
      _addLog('❌ Error handling Cloudflare: $e');
    }
  }

// Complete dialog blocker - runs after page is fully loaded
  Future<void> _injectDialogBlockerComplete() async {
    try {
      await _webController.runJavaScript('''
      (function() {
        console.log('🛡️ Comprehensive dialog blocking activated');
        
        // Re-override in case page scripts reset them
        window.alert = function(msg) { 
          console.log('🚫 Blocked alert: ' + msg); 
          return true; 
        };
        
        window.confirm = function(msg) { 
          console.log('🚫 Auto-confirmed (OK): ' + msg); 
          return true; 
        };
        
        window.prompt = function(msg, def) { 
          console.log('🚫 Auto-prompt response: ' + msg); 
          return def || 'ok'; 
        };
        
        // Override window.open to prevent popups
        window.open = function(url, name, features) {
          console.log('🚫 Blocked window.open: ' + url);
          // Instead of opening new window, navigate current window
          if (url && url.startsWith('http')) {
            window.location.href = url;
          }
          return null;
        };
        
        // Block beforeunload dialogs
        window.addEventListener('beforeunload', function(e) {
          e.preventDefault();
          return undefined;
        });
        
        // Handle adrinolinks specific redirect dialog prevention
        if (window.location.hostname.includes('adrinolinks')) {
          // Prevent the specific "click OK to be redirected" dialog
          var originalLocation = window.location;
          
          // Override location changes that might trigger dialogs
          Object.defineProperty(window, 'location', {
            get: function() { return originalLocation; },
            set: function(url) {
              console.log('🔄 Silent redirect to: ' + url);
              originalLocation.href = url;
            }
          });
        }
        
        // Remove any existing dialog elements from DOM
        setTimeout(function() {
          var dialogs = document.querySelectorAll('[role="dialog"], .modal, .popup, .alert, .confirm');
          dialogs.forEach(function(dialog) {
            if (dialog.textContent && dialog.textContent.includes('click OK')) {
              console.log('🧹 Removed existing dialog element');
              dialog.remove();
            }
          });
        }, 100);
        
        console.log('✅ Dialog blocking fully activated');
      })();
    ''');
      _addLog('🛡️ Complete dialog blocker injected');
    } catch (e) {
      _addLog('⚠️ Dialog blocker injection failed: $e');
    }
  }

// Inject the ad blocker script into the WebView and start it
  Future<void> _injectAdBlocker() async {
    try {
      if (_adBlockerScript.isEmpty) {
        _addLog('🛑 Ad blocker script is empty - not injected');
        return;
      }
      await _webController.runJavaScript(_adBlockerScript);
      // small wait for it to create window.flutterSurveyAdBlocker
      await Future.delayed(Duration(seconds: 1));
      // call start if present (defensive) and request stats
      try {
        await _webController.runJavaScript(
            'window.flutterSurveyAdBlocker && window.flutterSurveyAdBlocker.start && window.flutterSurveyAdBlocker.start();');
      } catch (_) {}
      _adBlockerLoaded = true;
      _addLog('🛡️ Ad blocker injected and started');
    } catch (e) {
      _addLog('Error injecting ad blocker: $e');
    }
  }

  // Load the ad blocker JavaScript into a Dart String (preload so injection is fast)
  Future<void> _loadAdBlockerScript() async {
    try {
      _adBlockerScript = '''
  // FlutterSurveyAdBlocker - minimal, robust ad remover for survey flows
  (function(){
    class FlutterSurveyAdBlocker {
      constructor() {
        this.allowedDomains = ['adrinolinks.in','gplinks.co','v2links.me','youtube.com','youtu.be'];
        this.adPatterns = {
          containers: ['[id*="container-"]','[class*="container-"]','[id*="popup"]','[id*="modal"]','[id*="overlay"]','[class*="popup"]','[class*="modal"]','[class*="overlay"]'],
          closeButtons: ['[class*="cancel"]','[class*="close"]','[class*="dismiss"]','button[title*="close"]','[data-dismiss]','.close','.cancel']
        };
        this.isRunning = false;
        this.stats = { removedAds: 0, blockedRedirects: 0, clickedButtons: 0 };
      }
  
      start() {
        if (this.isRunning) return;
        this.isRunning = true;
        try { this.removeExistingAds(); } catch(e){}
        this.setupMutationObserver();
        this.setupRedirectPrevention();
        this.startContinuousMonitoring();
      }
  
      removeExistingAds() {
        try {
          this.adPatterns.containers.forEach(sel => {
            try {
              document.querySelectorAll(sel).forEach(el => {
                if (this.isLikelyAd(el)) this.removeElement(el);
              });
            } catch(_) {}
          });
          this.removeHighZOverlays();
        } catch(_) {}
      }
  
      isLikelyAd(el) {
        if (!el) return false;
        try {
          const s = window.getComputedStyle(el);
          const z = parseInt(s.zIndex || '0');
          const rect = el.getBoundingClientRect();
          const overlay = (s.position === 'fixed' || s.position === 'absolute') && z > 900;
          const mentionsAd = (el.className && el.className.toLowerCase().includes('ad')) || (el.id && el.id.toLowerCase().includes('ad'));
          return overlay || mentionsAd || (rect.width > 200 && rect.height > 200);
        } catch(e){ return false; }
      }
  
      removeHighZOverlays() {
        try {
          document.querySelectorAll('*').forEach(el => {
            try {
              const s = window.getComputedStyle(el);
              const z = parseInt(s.zIndex || '0');
              if ((s.position === 'fixed' || s.position === 'absolute') && z > 9999) {
                const r = el.getBoundingClientRect();
                if (r.width > window.innerWidth*0.4 || r.height > window.innerHeight*0.4) {
                  this.removeElement(el);
                }
              }
            } catch(_) {}
          });
        } catch(_) {}
      }
  
      removeElement(el) {
        if (!el || !el.parentNode) return;
        try {
          el.style.display = 'none';
          el.remove();
          this.stats.removedAds++;
        } catch(e){}
      }
  
      clickElement(el) {
        if (!el || !el.offsetParent) return;
        try {
          el.click();
          this.stats.clickedButtons++;
        } catch(e){}
      }
  
      findCloseButton(container) {
        try {
          for (const sel of this.adPatterns.closeButtons) {
            const b = container.querySelector(sel);
            if (b && b.offsetParent !== null) return b;
          }
          // fallback check for common characters
          const btns = container.querySelectorAll('button, a, span, div');
          for (const b of btns) {
            const txt = (b.textContent||'').trim();
            if (txt === '×' || txt === '✕' || txt.toLowerCase().includes('close') || txt.toLowerCase().includes('cancel')) return b;
          }
        } catch(e){}
        return null;
      }
  
      startContinuousMonitoring() {
        if (this._interval) return;
        this._interval = setInterval(() => {
          try {
            this.removeExistingAds();
            this.handleSkipButtons();
          } catch(e){}
        }, 1000);
      }
  
      handleSkipButtons(){
        try {
          document.querySelectorAll('button, a').forEach(btn => {
            try {
              const t = (btn.textContent||'').toLowerCase();
              if ((t.includes('skip') && !t.includes('resume')) || t.includes('close') || t.includes('dismiss')) {
                if (btn.offsetParent !== null) {
                  this.clickElement(btn);
                }
              }
            } catch(_) {}
          });
        } catch(_) {}
      }
  
      setupMutationObserver() {
        try {
          const obs = new MutationObserver(muts => {
            muts.forEach(m => {
              m.addedNodes.forEach(n => {
                try {
                  if (n.nodeType === Node.ELEMENT_NODE) {
                    if (this.isLikelyAd(n)) {
                      const cb = this.findCloseButton(n);
                      if (cb) this.clickElement(cb);
                      else this.removeElement(n);
                    }
                  }
                } catch(_) {}
              });
            });
          });
          obs.observe(document.body, { childList: true, subtree: true });
        } catch(e){}
      }
  
      setupRedirectPrevention() {
        try {
          const origOpen = window.open;
          const self = this;
          window.open = function(url, t, f) {
            try {
              const allowed = self.isAllowedDomain(url);
              if (!allowed) {
                self.stats.blockedRedirects++;
                return null;
              }
            } catch(e){}
            return origOpen.call(window, url, t, f);
          };
        } catch(e){}
      }
  
      isAllowedDomain(url) {
        try {
          if (!url) return false;
          const u = new URL(url, document.location.href);
          const host = (u.hostname||'').toLowerCase();
          return this.allowedDomains.some(d => host === d || host.endsWith('.' + d));
        } catch(e){ return false; }
      }
  
      getStats(){ return this.stats; }
      stop(){ try{ clearInterval(this._interval); }catch(e){} this.isRunning=false; }
    }
  
    try {
      const inst = new FlutterSurveyAdBlocker();
      inst.start();
      window.flutterSurveyAdBlocker = inst;
    } catch(e){ console.error('adblocker init failed', e); }
  })();
''';
      // don't set state rapidly during startup; only mark ready
      _adBlockerLoaded = false;
    } catch (e) {
      _addLog('Error preparing ad blocker script: $e');
    }
  }

  Future<void> _getAdBlockerStats() async {
    try {
      final statsResult = await _webController.runJavaScriptReturningResult(
          'window.flutterSurveyAdBlocker ? JSON.stringify(window.flutterSurveyAdBlocker.getStats()) : null;');
      if (statsResult != null && statsResult != 'null') {
        String s = statsResult is String ? statsResult : statsResult.toString();
        if (s.startsWith('"') && s.endsWith('"')) {
          s = s.substring(1, s.length - 1).replaceAll('\\"', '"');
        }
        final parsed = jsonDecode(s);
        if (parsed is Map) {
          setState(() {
            _adBlockerStats = Map<String, dynamic>.from(parsed);
          });
          _addLog(
              '🛡️ Ad Blocker Stats - Ads removed: ${_adBlockerStats['removedAds'] ??
                  0}, Redirects blocked: ${_adBlockerStats['blockedRedirects'] ??
                  0}, Buttons clicked: ${_adBlockerStats['clickedButtons'] ??
                  0}');
        }
      }
    } catch (e) {
      _addLog('Error getting ad blocker stats: $e');
    }
  }

  Future<void> _loadInputData() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();

    // Load YouTube channels
    List<String>? channelStrings = prefs.getStringList('youtube_channels');
    if (channelStrings != null) {
      setState(() {
        _youtubeChannels = channelStrings.map((str) {
          Map<String, dynamic> map = json.decode(str);
          return YouTubeChannel.fromMap(map);
        }).toList();
      });
    }

    // Load cycle count
    String? cycleCount = prefs.getString('cycle_count');
    if (cycleCount != null) {
      _countController.text = cycleCount;
    }
  }

  Future<void> _saveInputData() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();

    // Save YouTube channels
    List<String> channelStrings = _youtubeChannels.map((channel) {
      return json.encode(channel.toMap());
    }).toList();
    await prefs.setStringList('youtube_channels', channelStrings);

    // Save cycle count
    await prefs.setString('cycle_count', _countController.text);
  }

  Future<void> _handleDialogsAutomatically() async {
    try {
      await _webController.runJavaScript('''
    // Store original functions if not already stored
    if (!window.originalAlert) {
      window.originalAlert = window.alert;
      window.originalConfirm = window.confirm;
      window.originalPrompt = window.prompt;
    }
    
    // Override JavaScript dialog functions to auto-handle them
    window.alert = function(message) {
      console.log('🤖 Auto-dismissed alert: ' + message);
      return true;
    };
    
    window.confirm = function(message) {
      console.log('🤖 Auto-confirmed dialog (clicked OK): ' + message);
      return true; // Always click OK
    };
    
    window.prompt = function(message, defaultText) {
      console.log('🤖 Auto-responded to prompt: ' + message);
      return defaultText || 'ok';
    };
    
    // Enhanced dialog handling with multiple approaches
    function handleVisibleDialogs() {
      // Method 1: Handle adrinolinks specific dialogs
      if (window.location.href.includes('adrinolinks.com') || 
          document.body.textContent.includes('click OK to be redirected')) {
        
        var okButtons = document.querySelectorAll('button, input[type="button"], input[type="submit"]');
        for (var i = 0; i < okButtons.length; i++) {
          var btn = okButtons[i];
          var btnText = (btn.textContent || btn.value || '').toLowerCase();
          if (btnText.includes('ok') || btnText === 'ok') {
            console.log('🤖 Clicking OK button:', btn.textContent || btn.value);
            btn.click();
            return true;
          }
        }
      }
      
      // Method 2: Handle any confirm-style dialogs in DOM
      var confirmElements = document.querySelectorAll('[role="dialog"], .modal, .popup, .confirm-dialog');
      for (var j = 0; j < confirmElements.length; j++) {
        var dialog = confirmElements[j];
        if (dialog.offsetParent !== null) { // If visible
          var okBtn = dialog.querySelector('button[data-action="ok"], button[data-action="confirm"], .ok-btn, .confirm-btn');
          if (okBtn) {
            console.log('🤖 Clicking dialog OK button');
            okBtn.click();
            return true;
          }
          
          // Look for buttons with OK text inside dialog
          var dialogButtons = dialog.querySelectorAll('button');
          for (var k = 0; k < dialogButtons.length; k++) {
            if ((dialogButtons[k].textContent || '').toLowerCase().includes('ok')) {
              console.log('🤖 Clicking dialog OK text button');
              dialogButtons[k].click();
              return true;
            }
          }
        }
      }
      
      return false;
    }
    
    // Initial attempt
    handleVisibleDialogs();
    
    // Set up periodic checking for new dialogs
    if (!window.dialogHandler) {
      window.dialogHandler = setInterval(function() {
        handleVisibleDialogs();
      }, 500);
      
      // Stop after 30 seconds to prevent infinite running
      setTimeout(function() {
        if (window.dialogHandler) {
          clearInterval(window.dialogHandler);
          window.dialogHandler = null;
        }
      }, 30000);
    }
    
    // Also set up mutation observer to catch dynamically added dialogs
    if (!window.dialogObserver && window.MutationObserver) {
      window.dialogObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.addedNodes.length > 0) {
            setTimeout(handleVisibleDialogs, 100);
          }
        });
      });
      
      window.dialogObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  ''');
      _addLog("🤖 Enhanced dialog automation enabled with periodic checking");
    } catch (e) {
      _addLog("⚠ Dialog automation setup failed: $e");
    }
  }

// Add these variables to your class
  final Random _random = Random(); // For humanized timing

// Add this new method after _initializeWebView()
  Future<void> _handleIntentUrl(String intentUrl) async {
    try {
      _addLog("🔧 Processing intent URL...");

      // Extract the actual URL from the intent
      if (intentUrl.contains('scheme=https') && intentUrl.contains('://')) {
        final regex = RegExp(r'intent://([^#]+)#Intent.*scheme=https');
        final match = regex.firstMatch(intentUrl);

        if (match != null) {
          final extractedUrl = 'https://${match.group(1)}';
          _addLog("🎯 Extracted URL: $extractedUrl");

          // Navigate to the extracted URL
          await Future.delayed(Duration(seconds: 2));
          await _webController.loadRequest(Uri.parse(extractedUrl));
          return;
        }
      }

      _addLog(
          "⚠️ Could not extract URL from intent, continuing with survey...");
    } catch (e) {
      _addLog("❌ Error handling intent URL: $e");
    }
  }

  void _handlePageLoaded() async {
    if (!_isRunning) return;

    String currentUrl = await _webController.currentUrl() ?? "";
    _addLog("📍 Current URL: $currentUrl");

    if (currentUrl.contains('youtube.com') &&
        _currentStep.contains('extract')) {
      await Future.delayed(Duration(seconds: 3));
      await _extractLinksFromYouTubeVideo();
    } else if (_currentStep.contains('survey')) {
      await _processSurveyPage(currentUrl);
    }
  }

  Future<void> _loadSavedData() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    setState(() {
      _usedIPs = (prefs.getStringList('used_ips') ?? []).toSet();
      _currentCycle = prefs.getInt('current_cycle') ?? 0;
      _totalCycles = prefs.getInt('total_cycles') ?? 0;
      if (_currentCycle > 0) {
        _countController.text = _totalCycles.toString();
        _youtubeController.text = prefs.getString('youtube_url') ?? '';
      }
    });
  }

  Future<void> _saveProgress() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    await prefs.setStringList('used_ips', _usedIPs.toList());
    await prefs.setInt('current_cycle', _currentCycle);
    await prefs.setInt('total_cycles', _totalCycles);
    await _saveInputData(); // Add this line
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Survey Automation'),
        backgroundColor: Colors.deepPurple,
        actions: [
          if (_isRunning)
            IconButton(
              icon: Icon(
                  _showWebView ? Icons.visibility_off : Icons.visibility),
              onPressed: () {
                setState(() {
                  _showWebView = !_showWebView;
                });
              },
            ),
        ],
      ),
      body: LayoutBuilder(
        builder: (context, constraints) {
          return Column(
            children: [
              // Control Panel with fixed height and scrolling
              Container(
                constraints: BoxConstraints(
                  maxHeight: constraints.maxHeight *
                      0.5, // Limit to 50% of screen
                ),
                child: SingleChildScrollView(
                  physics: AlwaysScrollableScrollPhysics(),
                  child: Container(
                    color: Colors.deepPurple.shade50,
                    padding: EdgeInsets.all(16),
                    child: Column(
                      children: [
                        // ── MacroDroid status banner ──
                        if (!_macroDroidLinked)
                          Container(
                            padding: EdgeInsets.all(8),
                            margin: EdgeInsets.only(bottom: 8),
                            decoration: BoxDecoration(
                              color: Colors.red.shade100,
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(color: Colors.red),
                            ),
                            child: Row(
                              children: [
                                Icon(Icons.error, color: Colors.red),
                                SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    'MacroDroid macro not linked. Airplane toggle won\'t work.',
                                    style: TextStyle(
                                        color: Colors.red.shade800),
                                  ),
                                ),
                                TextButton(
                                  onPressed: _openMacroDroidSettings,
                                  child: Text('Link'),
                                ),
                              ],
                            ),
                          )
                        else
                          Container(
                            padding: EdgeInsets.all(8),
                            margin: EdgeInsets.only(bottom: 8),
                            decoration: BoxDecoration(
                              color: Colors.green.shade100,
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(color: Colors.green),
                            ),
                            child: Row(
                              children: [
                                Icon(Icons.check_circle, color: Colors.green),
                                SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    'MacroDroid macro linked 👍',
                                    style: TextStyle(
                                        color: Colors.green.shade800),
                                  ),
                                ),
                              ],
                            ),
                          ),

                        // Airplane Mode Toggle at the top
                        if (!_isRunning)
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  'Airplane Mode:',
                                  style: TextStyle(fontWeight: FontWeight.bold),
                                ),
                              ),
                              ElevatedButton(
                                onPressed: () async {
                                  _addLog("✈️ Airplane ON (manual) …");
                                  final onOk = await AirplaneMacro.toggle();
                                  _addLog("   → sent: $onOk");

                                  await Future.delayed(Duration(seconds: 6));

                                  _addLog("✈️ Airplane OFF (manual) …");
                                  final offOk = await AirplaneMacro.toggle();
                                  _addLog("   → sent: $offOk");

                                  final real = await AirplaneMacro.getState();
                                  _addLog("🛰️ Real airplane state: ${real
                                      ? 'ON'
                                      : 'OFF'}");
                                },
                                child: Text('Toggle Airplane'),
                              ),
                            ],
                          ),
                        SizedBox(height: 8),

                        if (!_isRunning) ...[
                          _buildYouTubeChannelsInput(),
                          SizedBox(height: 8),
                          Row(
                            children: [
                              Expanded(
                                child: TextField(
                                  controller: _countController,
                                  keyboardType: TextInputType.number,
                                  decoration: InputDecoration(
                                    labelText: 'Cycles',
                                    border: OutlineInputBorder(),
                                    isDense: true,
                                  ),
                                ),
                              ),
                              SizedBox(width: 16),
                              ElevatedButton(
                                onPressed: _startAutomation,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.deepPurple,
                                  foregroundColor: Colors.white,
                                ),
                                child: Text('START'),
                              ),
                            ],
                          ),
                        ] else
                          ...[
                            Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment
                                        .start,
                                    children: [
                                      Text(
                                        'Cycle $_currentCycle/$_totalCycles',
                                        style: TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 16),
                                      ),
                                      LinearProgressIndicator(
                                        value: _totalCycles > 0
                                            ? _currentCycle / _totalCycles
                                            : 0,
                                        backgroundColor: Colors.grey[300],
                                        valueColor: AlwaysStoppedAnimation(
                                            Colors.deepPurple),
                                      ),
                                    ],
                                  ),
                                ),
                                SizedBox(width: 16),
                                Container(
                                  padding: EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.green.shade100,
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    'IP: $_currentIP',
                                    style: TextStyle(
                                      fontFamily: 'monospace',
                                      fontSize: 12,
                                      color: Colors.green.shade700,
                                    ),
                                  ),
                                ),
                                SizedBox(width: 8),
                                ElevatedButton(
                                  onPressed: _stopAutomation,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.red,
                                    foregroundColor: Colors.white,
                                  ),
                                  child: Text('STOP'),
                                ),
                              ],
                            ),
                            SizedBox(height: 8),
                            Container(
                              padding: EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.blue.shade100,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Row(
                                children: [
                                  SizedBox(
                                    width: 12,
                                    height: 12,
                                    child: CircularProgressIndicator(
                                        strokeWidth: 2),
                                  ),
                                  SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      _currentStep,
                                      style: TextStyle(fontSize: 12,
                                          fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                  if (_extractedLinks.isNotEmpty)
                                    Text(
                                      'Link ${_currentLinkIndex +
                                          1}/${_extractedLinks.length}',
                                      style: TextStyle(fontSize: 11),
                                    ),
                                ],
                              ),
                            ),
                          ],
                      ],
                    ),
                  ),
                ),
              ),

              // Bottom area (webview or logs) - takes remaining space
              Expanded(
                child: _isRunning && _showWebView
                    ? _buildLiveWebView()
                    : _buildLogsView(),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildLiveWebView() {
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: Colors.deepPurple, width: 2),
      ),
      child: WebViewWidget(controller: _webController),
    );
  }

  Widget _buildLogsView() {
    return Container(
      padding: EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Activity Logs',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.deepPurple,
                ),
              ),
              Row(
                children: [
                  IconButton(
                    icon: Icon(Icons.copy_all, color: Colors.deepPurple),
                    onPressed: _copyAllLogs,
                    tooltip: 'Copy All Logs',
                  ),
                  IconButton(
                    icon: Icon(Icons.clear, color: Colors.red),
                    onPressed: _clearLogs,
                    tooltip: 'Clear Logs',
                  ),
                ],
              ),
            ],
          ),
          SizedBox(height: 8),
          Expanded(
            child: ListView.builder(
              reverse: true,
              itemCount: _logs.length,
              itemBuilder: (context, index) {
                int reverseIndex = _logs.length - 1 - index;
                return Padding(
                  padding: EdgeInsets.symmetric(vertical: 1),
                  child: SelectableText(
                    _logs[reverseIndex],
                    style: TextStyle(
                      fontSize: 12,
                      fontFamily: 'monospace',
                    ),
                    enableInteractiveSelection: true,
                    contextMenuBuilder: (context, editableTextState) {
                      return AdaptiveTextSelectionToolbar.buttonItems(
                        anchors: editableTextState.contextMenuAnchors,
                        buttonItems: [
                          ContextMenuButtonItem(
                            label: 'Copy',
                            onPressed: () {
                              editableTextState.copySelection(
                                  SelectionChangedCause.toolbar);
                              _showCopySnackbar();
                            },
                          ),
                          ContextMenuButtonItem(
                            label: 'Select All',
                            onPressed: () {
                              editableTextState.selectAll(
                                  SelectionChangedCause.toolbar);
                            },
                          ),
                        ],
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

// Function to copy all logs to clipboard
  void _copyAllLogs() {
    if (_logs.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('No logs to copy')),
      );
      return;
    }

    String allLogs = _logs.join('\n');
    Clipboard.setData(ClipboardData(text: allLogs));
    _showCopySnackbar('All logs copied to clipboard');
  }

// Function to clear logs manually
  void _clearLogs() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('Clear Logs'),
          content: Text('Are you sure you want to clear all activity logs?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                setState(() {
                  _logs.clear();
                });
                Navigator.of(context).pop();
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Logs cleared')),
                );
              },
              style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
              child: Text('Clear', style: TextStyle(color: Colors.white)),
            ),
          ],
        );
      },
    );
  }

// Function to show copy confirmation
  void _showCopySnackbar([String? message]) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message ?? 'Text copied to clipboard'),
        duration: Duration(seconds: 2),
        backgroundColor: Colors.green,
      ),
    );
  }

  /// Persist the full set of used IPs to disk.
  Future<void> _saveUsedIPs() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList('usedIPs', _usedIPs.toList());
  }

  /// Load the persisted IP history into memory.
  Future<void> _loadUsedIPs() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getStringList('usedIPs') ?? [];
    setState(() => _usedIPs = saved.toSet());
  }

  /// Expands the “Show more” on YouTube and scrapes both anchor hrefs and plain-text URLs from the description.
  /// This implementation handles plain text links (yt-attributed-string) and intent:// links, dedupes,
  /// and filters out internal YouTube navigation links while keeping external/survey links.
  Future<bool> _extractClickThroughLinksFromYouTube(
      {Function(List<Map<String, dynamic>>)? onLinksExtracted}) async {
    _addLog("🔍 Extracting click-through links from YouTube description…");
    try {
      final currentUrl = await _webController.currentUrl() ?? "";
      final isMobile = currentUrl.contains('m.youtube.com');
      _addLog("📱 YouTube version: ${isMobile ? 'Mobile' : 'Desktop'}");

      // Attempt to expand description
      await _webController.runJavaScript('''
    (function(){
      const expandCandidates = [
        '#expand', '#expand-sizer', '#expand-button', '#expand-button.yt',
        'tp-yt-paper-button#expand', 'tp-yt-paper-button#expand-sizer',
        'ytd-text-inline-expander tp-yt-paper-button',
        'ytd-text-inline-expander #expand',
        '[aria-label*="Show more"]', '[aria-label*="more"]'
      ];
      for (const sel of expandCandidates) {
        try {
          const b = document.querySelector(sel);
          if (b && b.offsetParent !== null) { b.click(); console.log('Clicked expand', sel); break; }
        } catch(e){}
      }
      // attempt to scroll description into view so content loads
      try {
        const el = document.querySelector('#description-inner') || document.querySelector('ytd-text-inline-expander') || document.querySelector('yt-attributed-string');
        if (el) el.scrollIntoView({behavior:'smooth'});
      } catch(e){}
    })();
  ''');

      // Wait a bit for the description to expand / render
      await Future.delayed(Duration(seconds: 3));
      _addLog("📖 Attempted to expand YouTube description");

      // Enhanced JS extraction with survey type detection
      final result = await _webController.runJavaScriptReturningResult('''
    (function(){
      try {
        function extractFromText(text) {
          const urls = [];
          if (!text) return urls;
          const re = /(?:https?:\\/\\/|intent:\\/\\/|www\\.)[^\\s'\"]+/gi;
          let m;
          while ((m = re.exec(text)) !== null) {
            let s = m[0];
            // strip trailing punctuation
            while (s && s.length > 0 && '.,;:!?'.includes(s.charAt(s.length -1))) {
              s = s.slice(0, -1);
            }
            urls.push(s);
          }
          return urls;
        }

        function determineSurveyType(url) {
          const urlLower = url.toLowerCase();
          if (urlLower.includes('adrinolinks') || urlLower.includes('adrino')) return 'adrinolinks';
          if (urlLower.includes('v2links') || urlLower.includes('v2link')) return 'v2links';
          if (urlLower.includes('gplinks') || urlLower.includes('gplink')) return 'gplinks';
          return 'unknown';
        }

        const containers = [
          document.querySelector('#description-inner'),
          document.querySelector('#description'),
          document.querySelector('#description-text-container'),
          document.querySelector('ytd-text-inline-expander'),
          document.querySelector('yt-attributed-string'),
          document.querySelector('ytd-structured-description-content-renderer'),
          document.body
        ];

        let desc = null;
        for (const c of containers) {
          if (c) { desc = c; break; }
        }
        if (!desc) desc = document.body;

        const found = [];
        // 1) anchor hrefs
        try {
          const anchors = desc.querySelectorAll ? desc.querySelectorAll('a[href]') : [];
          anchors.forEach(a => {
            try {
              const href = a.href;
              const txt = (a.textContent || '').trim();
              if (href) found.push({url: href, text: txt, isYouTubeRedirect: href.includes('youtube.com/redirect')});
            } catch(e){}
          });
        } catch(e){}

        // 2) plain-text URLs inside description nodes
        try {
          const textContent = desc.innerText || desc.textContent || '';
          const plainUrls = extractFromText(textContent);
          plainUrls.forEach(u => {
            found.push({url: u, text: u, isYouTubeRedirect: u.includes('youtube.com/redirect')});
          });
        } catch(e){}

        // Normalize intent:// urls into https when possible
        const normalized = found.map(item => {
          let url = item.url.trim();
          const txt = item.text || '';
          if (url.startsWith('intent://')) {
            const m = /intent:\\/\\/([^#]+)(?:#Intent;(.*))?/.exec(url);
            if (m) {
              const path = m[1] || '';
              const params = m[2] || '';
              if (params.includes('scheme=https')) {
                url = 'https://' + path;
              } else if (params.includes('scheme=http')) {
                url = 'http://' + path;
              }
            }
          }
          return {url: url.replace(/\\s+/g, ''), text: txt, isYouTubeRedirect: !!item.isYouTubeRedirect};
        });

        // dedupe & filter out internal youtube navigation links
        const seen = new Set();
        const out = [];
        for (const it of normalized) {
          try {
            let u = (it.url || '').trim();
            if (!u) continue;
            // remove trailing punctuation again just in case
            while (u && u.length > 0 && '.,;:!?'.includes(u.charAt(u.length -1))) {
              u = u.slice(0, -1);
            }
            if (seen.has(u)) continue;

            // use a temporary <a> to parse hostname
            const a = document.createElement('a');
            a.href = u;
            const host = (a.hostname || '').toLowerCase();

            const isYouTubeHost = host.includes('youtube.com') || host.includes('youtu.be') || host.includes('m.youtube.com');
            const isSurveyHost = host.includes('adrinolinks') || host.includes('gplinks') || host.includes('v2links') || host.includes('gplinks.co') || host.includes('v2links.me') || host.includes('adrinolinks.in');

            // If it's a YouTube internal link (channel / watch) and NOT a redirect AND not a survey host -> skip
            if (isYouTubeHost && !it.isYouTubeRedirect && !isSurveyHost) {
              continue;
            }

            seen.add(u);
            
            // Enhanced: Add survey type detection
            const surveyType = determineSurveyType(u);
            
            out.push({
              url: u, 
              text: it.text || '', 
              isYouTubeRedirect: !!it.isYouTubeRedirect,
              surveyType: surveyType,
              displayName: surveyType.charAt(0).toUpperCase() + surveyType.slice(1)
            });
          } catch(e){}
        }

        return JSON.stringify(out);
      } catch(e) {
        return JSON.stringify([]);
      }
    })();
  ''');

      _addLog("🔍 JavaScript extraction completed");

      // Parse returned JSON
      List<dynamic> linksData;
      try {
        String resultString;
        if (result is String) {
          resultString = result;
        } else {
          resultString = result.toString();
        }

        _addLog("📄 Raw JS result (truncated): ${resultString.length > 300
            ? resultString.substring(0, 300) + '...'
            : resultString}");

        if (resultString.isEmpty || resultString == 'null' ||
            resultString == '[]') {
          linksData = [];
        } else {
          // Remove wrapping quotes if present
          if (resultString.startsWith('"') && resultString.endsWith('"')) {
            resultString =
                resultString.substring(1, resultString.length - 1).replaceAll(
                    '\\"', '"');
          }
          linksData = jsonDecode(resultString) as List<dynamic>;
        }
      } catch (parseError) {
        _addLog("❌ JSON parsing error: $parseError");
        _addLog("📄 Raw result was: ${result.toString()}");
        try {
          final alternativeResult = result.toString();
          if (alternativeResult.contains('[') &&
              alternativeResult.contains(']')) {
            final startIndex = alternativeResult.indexOf('[');
            final endIndex = alternativeResult.lastIndexOf(']') + 1;
            final jsonPart = alternativeResult.substring(startIndex, endIndex);
            _addLog("🔄 Trying alternative parsing with truncated data...");
            linksData = jsonDecode(jsonPart) as List<dynamic>;
          } else {
            return false;
          }
        } catch (alternativeError) {
          _addLog("❌ Alternative parsing also failed: $alternativeError");
          return false;
        }
      }

      if (linksData.isEmpty) {
        _addLog("❌ No click-through links found in description");
        _addLog("💡 This might mean:");
        _addLog("   • Video has no links in description");
        _addLog("   • Links are not survey-related");
        _addLog("   • Description didn't expand properly");
        return false;
      }

      // Build final list of enhanced link objects - ONLY SURVEY LINKS
      final enhancedLinks = <Map<String, dynamic>>[];
      _surveyTypeStats =
      {'adrinolinks': 0, 'gplinks': 0, 'v2links': 0, 'unknown': 0};
      int ignoredLinks = 0;

      for (var linkData in linksData) {
        try {
          final data = linkData as Map<String, dynamic>;
          final url = data['url'] as String;
          final surveyType = data['surveyType'] as String? ?? 'unknown';
          final displayName = data['displayName'] as String? ?? 'Unknown';

          // Create a temporary anchor to parse the hostname
          final Uri uri = Uri.parse(url);
          final String host = uri.host.toLowerCase();

          // List of domains to ignore
          final List<String> ignoredDomains = [
            'adrinolinks.in',
            'adrinolinks.com',
            'v2links.me',
            'gplinks.co'
          ];

          // Check if the host is in the ignored domains list
          final bool isIgnoredDomain = ignoredDomains.any((domain) =>
          host == domain || host.endsWith('.$domain')
          );

          if (url.isNotEmpty && !isIgnoredDomain) {
            // Update statistics for all found links
            _surveyTypeStats[surveyType] =
                (_surveyTypeStats[surveyType] ?? 0) + 1;

            // ONLY ADD SURVEY LINKS - IGNORE UNKNOWN LINKS
            if (surveyType == 'adrinolinks' || surveyType == 'gplinks' ||
                surveyType == 'v2links') {
              enhancedLinks.add({
                'url': url,
                'text': data['text'] ?? '',
                'surveyType': surveyType,
                'displayName': displayName,
                'isYouTubeRedirect': data['isYouTubeRedirect'] ?? false
              });
              _addLog("✅ Added ${displayName} link: $url");
            } else {
              ignoredLinks++;
              _addLog("🚫 Ignored unknown link: $url");
            }
          } else {
            ignoredLinks++;
            _addLog("🚫 Ignored domain link: $url");
          }
        } catch (e) {
          _addLog("⚠️ Skipping malformed link data: $e");
        }
      }

      if (enhancedLinks.isEmpty) {
        _addLog("❌ No valid URLs extracted from link data");
        return false;
      }

      setState(() => _extractedLinks = enhancedLinks);

      _addLog("📋 Found ${enhancedLinks.length} survey link(s) to process:");
      _addLog("📊 Survey Type Distribution:");
      _surveyTypeStats.forEach((type, count) {
        if (count > 0) {
          if (type == 'unknown') {
            _addLog("   • ${type.toUpperCase()}: $count links (IGNORED)");
          } else {
            _addLog("   • ${type.toUpperCase()}: $count links (WILL PROCESS)");
          }
        }
      });

      if (ignoredLinks > 0) {
        _addLog("🚫 Ignored $ignoredLinks unknown/non-survey links");
      }

      _addLog("📝 Survey links that will be processed:");
      for (int i = 0; i < enhancedLinks.length; i++) {
        final link = enhancedLinks[i];
        _addLog("   ${i + 1}. [${link['displayName']}] ${link['url']}");
      }

      // After creating enhancedLinks, count them by Adrino ID
      Map<String, int> adrinoIdCounts = {};
      for (var link in enhancedLinks) {
        String adrinoId = _extractAdrinoIdFromUrl(link['url']);
        adrinoIdCounts[adrinoId] = (adrinoIdCounts[adrinoId] ?? 0) + 1;
      }
      // Instead of setting _extractedLinks directly, use the callback if provided
      if (onLinksExtracted != null) {
        onLinksExtracted(enhancedLinks);
      } else {
        setState(() {
          _extractedLinks = enhancedLinks;
        });
      }

      // Return success status
      return enhancedLinks.isNotEmpty;
      // Update the YouTube channel with the link count
      // Use a different variable name to avoid conflict with the existing currentUrl
      String pageUrl = await _webController.currentUrl() ?? "";
      // Update the YouTube channel with the link count
      // Use the existing currentUrl variable if it's already defined
      for (var channel in _youtubeChannels) {
        if (currentUrl.contains(channel.url)) {
          // Find the dominant Adrino ID in this channel
          String dominantAdrinoId = '';
          int maxCount = 0;
          adrinoIdCounts.forEach((id, count) {
            if (count > maxCount) {
              maxCount = count;
              dominantAdrinoId = id;
            }
          });

          setState(() {
            channel.adrinoId = dominantAdrinoId;
          });
          break;
        }
      }
      _addLog(
          "✅ Click-through links extracted successfully with survey type detection");
      return true;
    } catch (e) {
      _addLog("❌ Click-through extraction failed: $e");
      return false;
    }
  }

  Future<void> _clearWebViewCache() async {
    try {
      await _webController.clearCache();
      await _webController.runJavaScript('window.localStorage.clear();');
      await _webController.runJavaScript('window.sessionStorage.clear();');
      _addLog("🧹 Cleared WebView cache and storage");
    } catch (e) {
      _addLog("⚠️ Error clearing WebView cache: $e");
    }
  }

// Add these variables to your class
  Timer? _healthCheckTimer;
  String _lastUrl = "";
  int _healthCheckCount = 0;

  void _startHealthChecks() {
    // Cancel any existing health check
    _healthCheckTimer?.cancel();

    _healthCheckTimer = Timer.periodic(Duration(seconds: 15), (timer) {
      if (!_isRunning) {
        timer.cancel();
        return;
      }

      // Use a separate async function to handle the health check
      _performHealthCheck();
    });
  }

// Separate method for the async health check
  Future<void> _performHealthCheck() async {
    try {
      // Check if webview is responsive
      String currentUrl = await _webController.currentUrl() ?? "";
      _addLog("❤️ Health check: Current URL - $currentUrl");

      // If we've been on the same URL for too long, try to recover
      if (_lastUrl == currentUrl && _healthCheckCount > 2) {
        _addLog("⚠️ Stuck detection: Same URL for multiple health checks");
        _addLog("🔄 Attempting recovery by reloading page");
        await _webController.reload();
        await Future.delayed(Duration(seconds: 3));
        _healthCheckCount = 0;
      }

      _lastUrl = currentUrl;
      _healthCheckCount++;
    } catch (e) {
      _addLog("❌ Health check failed: $e");
      _addLog("🔄 Attempting to recover WebView");
      // Don't use await with _initializeWebView since it returns void
      _initializeWebView();
    }
  }

// REPLACE your entire _startAutomation method with this:
  void _startAutomation() {
    if (_countController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Please enter the number of cycles')),
      );
      return;
    }

    if (_youtubeChannels.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Please add at least one YouTube channel')),
      );
      return;
    }

    setState(() {
      _isRunning = true;
      _showWebView = true;
      _totalCycles = int.parse(_countController.text);
      _currentCycle = 0;
      _logs.clear();
      _extractedLinks.clear();
      _currentLinkIndex = 0;
      _currentChannelIndex = 0;
      _isProcessingChannel = false;
    });

    _addLog("🚀 Starting automation with $_totalCycles cycles");
    _addLog("📺 Processing ${_youtubeChannels.length} YouTube channels");

    for (var channel in _youtubeChannels) {
      _addLog("   • ${channel.url}: Adrino ID ${channel.adrinoId}");
    }

    _runAutomationCycles();
  }

  void _stopAutomation() {
    setState(() {
      _isRunning = false;
      _showWebView = false;
      _currentStep = "Stopped";
    });

    // Cancel all timers and background processes
    _automationTimer?.cancel();

    // Stop any ongoing webview operations
    if (_webController != null) {
      _webController.loadRequest(Uri.parse('about:blank'));
    }

    // Clear any pending operations and reset state
    _extractedLinks.clear();
    _currentLinkIndex = 0;
    _currentCycle = 0;
    _retryCount = 0;
    _currentSurveyStep = 0;
    _currentSurveyType = "";

    _addLog("⏹ Automation completely stopped by user");
  }

// Add this method for WebView recovery
  Future<void> _resetWebView() async {
    try {
      _addLog("🔄 Resetting WebView...");

      // Clear the current WebView
      await _webController.loadRequest(Uri.parse('about:blank'));
      await Future.delayed(Duration(seconds: 1));

      // Re-initialize the WebView settings without creating a new controller
      await _webController.clearCache();
      await _webController.runJavaScript('window.localStorage.clear();');
      await _webController.runJavaScript('window.sessionStorage.clear();');

      // Re-inject the early dialog blocker
      _injectDialogBlockerEarly();

      _addLog("✅ WebView reset completed");
    } catch (e) {
      _addLog("❌ WebView reset failed: $e");
      // Fallback to full reinitialization
      _initializeWebView();
    }
  }
  Future<void> _handleStuckWebView() async {
    _addLog("🔄 Handling stuck WebView...");

    try {
      // First, try to scroll to a different position
      await _webController.runJavaScript('''
      window.scrollTo(0, 0);
      setTimeout(function() {
        window.scrollTo(0, document.body.scrollHeight);
      }, 1000);
    ''');

      await Future.delayed(Duration(seconds: 2));

      // Check if we're still stuck by comparing scroll position
      Object? scrollResult = await _webController.runJavaScriptReturningResult('''
      (function() {
        return {
          scrollY: window.scrollY,
          scrollX: window.scrollX,
          bodyHeight: document.body.scrollHeight,
          windowHeight: window.innerHeight
        };
      })();
    ''');

      _addLog("📊 Scroll position: $scrollResult");

      // If we're stuck at the same position, try to force navigation
      String currentUrl = await _webController.currentUrl() ?? "";
      if (currentUrl.contains("adrinolinks") || currentUrl.contains("procinehub")) {
        _addLog("🔄 Force reloading stuck page...");
        await _webController.reload();
        await Future.delayed(Duration(seconds: 3));
      }

      // Inject JavaScript to prevent scroll hijacking
      await _webController.runJavaScript('''
      (function() {
        // Prevent scroll hijacking
        window.addEventListener('scroll', function(e) {
          e.stopImmediatePropagation();
        }, true);
        
        // Prevent any scroll manipulation
        var originalScrollTo = window.scrollTo;
        window.scrollTo = function() {
          console.log('ScrollTo intercepted');
          // Allow scroll but don't let page override it
          originalScrollTo.apply(window, arguments);
        };
      })();
    ''');

    } catch (e) {
      _addLog("❌ Error handling stuck WebView: $e");
    }
  }

  void _runAutomationCycles() async {
    // Extract links from all YouTube channels
    Map<String, List<Map<String, dynamic>>> linksByAdrinoId = {};
    // Add a list to track completion order
    List<Map<String, dynamic>> completionSequence = [];

    for (int i = 0; i < _youtubeChannels.length; i++) {
      if (!_isRunning) break;

      final youtubeChannel = _youtubeChannels[i];
      _addLog(
          "🎬 Extracting links from YouTube channel ${i + 1}/${_youtubeChannels
              .length}");

      setState(() {
        _currentStep = "Extracting links from channel ${i + 1}";
      });

      // Change IP BEFORE loading YouTube channel
      if (!await _changeIPUntilUnique()) {
        _addLog("❌ Failed to get unique IP, stopping automation");
        return;
      }
      // SIMPLE: Load YouTube channel after IP change
      await _loadYouTubeAfterIPChange(youtubeChannel.url);

      // Load YouTube channel with timeout
      try {
        await _safeNavigateToUrl(
            youtubeChannel.url, purpose: "YouTube channel loading");
      } catch (e) {
        _addLog("❌ Failed to load YouTube channel: ${youtubeChannel.url}");
        continue;
      }

      // Extract links
      List<Map<String, dynamic>> extractedLinks = [];
      bool success = await _safeExtractLinksFromYouTube(
          onLinksExtracted: (links) {
            extractedLinks = links;
          }
      );

      if (success && extractedLinks.isNotEmpty) {
        // Tag each link with its Adrino ID
        for (var linkData in extractedLinks) {
          linkData['adrinoId'] = youtubeChannel.adrinoId;
          linkData['sourceChannel'] = youtubeChannel.url;
        }

        if (!linksByAdrinoId.containsKey(youtubeChannel.adrinoId)) {
          linksByAdrinoId[youtubeChannel.adrinoId] = [];
        }
        linksByAdrinoId[youtubeChannel.adrinoId]!.addAll(extractedLinks);
        _extractedLinksByVideo[youtubeChannel.url] = List.from(extractedLinks);

        _addLog("✅ Extracted ${extractedLinks.length} links from channel ${i +
            1} for Adrino ID ${youtubeChannel.adrinoId}");

        // PROCESS LINKS IMMEDIATELY AFTER EXTRACTION
        for (var linkData in extractedLinks) {
          if (!_isRunning) break;

          // Process the survey link
          bool surveySuccess = await _processSurveyWithHumanBehavior(linkData);
          if (surveySuccess) {
            _addLog("✅ Survey completed successfully");
            // Update completion counts
            final String linkId = _extractLinkId(linkData['url']);
            _linkCompletions[linkId] = (_linkCompletions[linkId] ?? 0) + 1;

            // Record completion sequence with timestamp
            completionSequence.add({
              'linkId': linkId,
              'url': linkData['url'],
              'displayName': linkData['displayName'],
              'timestamp': DateTime.now(),
              'completionCount': _linkCompletions[linkId]!
            });
          }

          // Clear WebView cache between links
          await _clearWebViewCache();
        }
      } else {
        _addLog("❌ Failed to extract links from channel ${i + 1}");
      }
    }

    if (linksByAdrinoId.isEmpty) {
      _addLog("❌ No valid links extracted from any channel");
      _stopAutomation();
      return;
    }

    // Create a list of all links to process
    List<Map<String, dynamic>> allLinks = [];
    linksByAdrinoId.forEach((adrinoId, links) {
      allLinks.addAll(links);
    });

    // Calculate unique cycle counts for each link while keeping total close to target
    int totalLinks = allLinks.length;
    Random random = Random();

    // Calculate the ideal average cycles per link
    int idealAverage = (_totalCycles / totalLinks).round();
    int minCycles = (idealAverage * 0.7).round().clamp(1, idealAverage - 1);
    int maxCycles = (idealAverage * 1.3).round().clamp(
        idealAverage + 1, _totalCycles);

    _addLog("📊 Distributing $_totalCycles cycles across $totalLinks links");
    _addLog("   • Ideal average: $idealAverage cycles per link");
    _addLog("   • Minimum cycles per link: $minCycles");
    _addLog("   • Maximum cycles per link: $maxCycles");

    // Generate unique cycle counts for each link
    Set<int> usedCycleCounts = {};
    Map<String, int> linkTargets = {};
    int remainingCycles = _totalCycles;

    // First pass: assign unique cycle counts within the range
    for (int i = 0; i < totalLinks; i++) {
      final linkData = allLinks[i];
      final String linkId = _extractLinkId(linkData['url']);

      int cycleCount;
      int attempts = 0;

      do {
        // Generate a random cycle count within the range
        cycleCount = minCycles + random.nextInt(maxCycles - minCycles + 1);
        attempts++;

        // If we can't find a unique value after many attempts, adjust the range
        if (attempts > 50) {
          // Expand the range slightly to find a unique value
          cycleCount = (minCycles - 5).clamp(1, maxCycles + 5) +
              random.nextInt(
                  (maxCycles - minCycles + 10).clamp(1, _totalCycles));
        }
      } while (usedCycleCounts.contains(cycleCount) && attempts < 100);

      // Ensure we don't allocate more cycles than remaining
      int cyclesLeftForOtherLinks = (totalLinks - i - 1) * minCycles;
      cycleCount =
          cycleCount.clamp(1, remainingCycles - cyclesLeftForOtherLinks);

      usedCycleCounts.add(cycleCount);
      linkTargets[linkId] = cycleCount;
      _linkCompletions[linkId] = 0;
      remainingCycles -= cycleCount;
    }

    // Second pass: distribute any remaining cycles or adjust if we overspent
    if (remainingCycles != 0) {
      _addLog(
          "🔄 Adjusting distribution to handle remaining cycles: $remainingCycles");

      if (remainingCycles > 0) {
        // We have extra cycles to distribute
        List<String> linkIds = linkTargets.keys.toList();

        while (remainingCycles > 0 && linkIds.isNotEmpty) {
          // Shuffle the list to distribute randomly
          linkIds.shuffle(random);

          for (String linkId in linkIds) {
            if (remainingCycles <= 0) break;

            // Add one cycle to this link
            linkTargets[linkId] = linkTargets[linkId]! + 1;
            remainingCycles -= 1;

            // If we've added a cycle that makes it match another link, try to make it unique
            if (usedCycleCounts.contains(linkTargets[linkId])) {
              // Try to make it unique by adding one more if possible
              if (remainingCycles > 0) {
                linkTargets[linkId] = linkTargets[linkId]! + 1;
                remainingCycles -= 1;
              }
            }

            usedCycleCounts.add(linkTargets[linkId]!);
          }
        }
      } else {
        // We need to reduce cycles (overspent)
        int cyclesToReduce = -remainingCycles;
        List<String> linkIds = linkTargets.keys.toList();

        while (cyclesToReduce > 0 && linkIds.isNotEmpty) {
          // Shuffle the list to reduce randomly
          linkIds.shuffle(random);

          for (String linkId in linkIds) {
            if (cyclesToReduce <= 0) break;

            if (linkTargets[linkId]! > 1) {
              // Reduce one cycle from this link
              linkTargets[linkId] = linkTargets[linkId]! - 1;
              cyclesToReduce -= 1;

              // If reducing made it match another link, try to make it unique
              if (usedCycleCounts.contains(linkTargets[linkId])) {
                // Try to reduce one more if possible
                if (linkTargets[linkId]! > 1 && cyclesToReduce > 0) {
                  linkTargets[linkId] = linkTargets[linkId]! - 1;
                  cyclesToReduce -= 1;
                }
              }

              usedCycleCounts.add(linkTargets[linkId]!);
            }
          }
        }
      }
    }

    // Calculate the actual total cycles we'll process
    int actualTotalCycles = linkTargets.values.fold(
        0, (sum, count) => sum + count);

    // Update the UI to reflect the actual total
    setState(() {
      _totalCycles = actualTotalCycles;
    });

    _addLog(
        "🔄 Actual total cycles: $actualTotalCycles (target: ${_countController
            .text})");

    // Log distribution
    _addLog("📋 Unique cycle distribution:");
    linkTargets.forEach((linkId, target) {
      _addLog("   • Link $linkId: $target cycles (unique)");
    });

    // Verify uniqueness
    Set<int> verificationSet = {};
    bool allUnique = true;
    for (int count in linkTargets.values) {
      if (verificationSet.contains(count)) {
        allUnique = false;
        break;
      }
      verificationSet.add(count);
    }

    if (allUnique) {
      _addLog("✅ All link cycle counts are unique!");
    } else {
      _addLog("⚠️ Some link cycle counts are not unique (best effort)");
    }

// Process links until all targets are met
    int totalCompleted = 0;
    int cycle = 1;
    while (totalCompleted < _totalCycles && _isRunning) {
      setState(() {
        _currentCycle = cycle;
        _currentStep = "Cycle $cycle: Changing IP...";
      });

      _addLog("🔄 === CYCLE $cycle STARTED ===");

      // Process each link that hasn't reached its target
      for (int linkIndex = 0; linkIndex < allLinks.length; linkIndex++) {
        if (!_isRunning) break;

        final linkData = allLinks[linkIndex];
        final String linkId = _extractLinkId(linkData['url']);
        final int currentCompletions = _linkCompletions[linkId] ?? 0;
        final int targetCompletions = linkTargets[linkId] ?? 0;

        // Skip if this link has reached its target
        if (currentCompletions >= targetCompletions) {
          continue;
        }
        setState(() {
          _currentLinkIndex = linkIndex;
          _currentStep = "Cycle $cycle: Processing ${linkData['displayName']}";
        });

        _addLog(
            "🔗 Processing: [${linkData['displayName']}] ${linkData['url']}");

        // Reset retry count for each link
        _retryCount = 0;

        // First navigate to the source YouTube channel
        await _webController.loadRequest(Uri.parse(linkData['sourceChannel']));
        await Future.delayed(Duration(seconds: 3));

        // Process the survey link with retries
        bool success = await _processSurveyWithRetries(linkData);
        if (success) {
          _linkCompletions[linkId] = currentCompletions + 1;
          totalCompleted++;

          // Record completion sequence with timestamp
          completionSequence.add({
            'linkId': linkId,
            'url': linkData['url'],
            'displayName': linkData['displayName'],
            'timestamp': DateTime.now(),
            'completionCount': _linkCompletions[linkId]!
          });

          _addLog("✅ Survey completed successfully ($totalCompleted/$_totalCycles)");

          // Check if we've reached the target
          if (totalCompleted >= _totalCycles) {
            break;
          }
        } else {
          _addLog("❌ Survey failed after $MAX_RETRIES retries");
        }

        // Random delay between surveys
        int delay = Random().nextInt(10) + 5;
        _addLog("⏱ Waiting $delay seconds before next survey...");
        await Future.delayed(Duration(seconds: delay));
      }

      _addLog("✅ === CYCLE $cycle COMPLETED ===");
      await _saveProgress();
      cycle++;
    }
    // Show completion sequence
    _addLog("📋 Completion Sequence:");
    for (int i = 0; i < completionSequence.length; i++) {
      var completion = completionSequence[i];
      _addLog("   ${i +
          1}. [${completion['displayName']}] completed at ${completion['timestamp']}");
    }

    _showCompletionDialog(completionSequence);
    if (_isRunning) {
      // Clear the WebView to prevent getting stuck on the final page
      await _webController.loadRequest(Uri.parse('about:blank'));

      setState(() {
        _isRunning = false;
        _showWebView = false;
        _currentStep = "🎉 All cycles completed!";
      });

      // Show completion statistics by Adrino ID
      _addLog("📊 Completion Statistics by Adrino ID:");
      linksByAdrinoId.forEach((adrinoId, links) {
        int totalCompletions = 0;
        for (var linkData in links) {
          final String linkId = _extractLinkId(linkData['url']);
          final int completions = _linkCompletions[linkId] ?? 0;
          totalCompletions += completions;
        }

        _addLog("   • $adrinoId: $totalCompletions completions (${links
            .length} links)");
      });


    }
  }

  String _extractLinkId(String url) {
    try {
      final uri = Uri.parse(url);
      // Extract ID from common survey link patterns
      if (uri.host.contains('adrinolinks')) {
        return uri.pathSegments.isNotEmpty ? uri.pathSegments.last : url;
      } else if (uri.queryParameters.containsKey('id')) {
        return uri.queryParameters['id']!;
      } else {
        // Use a hash of the URL as fallback ID
        return url.hashCode.toString();
      }
    } catch (e) {
      return url.hashCode.toString();
    }
  }

  Future<bool> _changeIPUntilUnique() async {
    String newIP = "unknown";
    int attempts = 0;
    final random = Random();
    bool isCurrentlyInAirplaneMode = false;

    do {
      attempts++;
      setState(() {
        _currentStep = "Changing IP... attempt $attempts";
      });
      _addLog("🔄 Changing IP attempt $attempts...");

      // Check current airplane mode state before toggling
      try {
        isCurrentlyInAirplaneMode = await AirplaneMacro.getState();
        _addLog("✈️ Current airplane mode state: ${isCurrentlyInAirplaneMode ? 'ON' : 'OFF'}");
      } catch (e) {
        _addLog("❌ Failed to get airplane mode state: $e");
        // Continue with toggling anyway
      }
      if (await _isAirplaneModeStuck()) {
        _addLog("🚨 Airplane mode appears to be stuck! Attempting recovery...");
        await _recoverFromAirplaneModeStuck();
      }
      // Add random delay before IP change
      int preDelay = random.nextInt(3) + 1;
      _addLog("⏱ Waiting $preDelay seconds before IP change...");
      await Future.delayed(Duration(seconds: preDelay));

      // Only toggle if we're not already in the desired state
      if (!isCurrentlyInAirplaneMode) {
        // ── MacroDroid ON cycle ──
        _addLog('✈️ Airplane ON via MacroDroid…');
        final onOk = await AirplaneMacro.toggle();
        _addLog('   → sent: $onOk');
      }

      // Random delay for network drop/re‑acquire
      int airplaneDelay = random.nextInt(3) + 4;
      await Future.delayed(Duration(seconds: airplaneDelay));

      // Check if airplane mode is actually on before turning it off
      bool isAirplaneModeOn = await AirplaneMacro.getState();
      if (isAirplaneModeOn) {
        // OFF
        _addLog('✈️ Airplane OFF via MacroDroid…');
        final offOk = await AirplaneMacro.toggle();
        _addLog('   → sent: $offOk');
      } else {
        _addLog('⚠️ Airplane mode not activated, skipping OFF toggle');
      }

      // Random delay for reconnection
      int reconnectDelay = random.nextInt(3) + 5;
      await Future.delayed(Duration(seconds: reconnectDelay));

      // Wait for reconnection with timeout
      bool connected = await _waitForConnectionWithTimeout();
      if (!connected) {
        _addLog("❌ Failed to reconnect to internet");
        if (attempts >= 3) {
          _addLog("⚠️ Multiple connection failures, trying to continue anyway");
          break;
        }
        continue;
      }

      // Get new IP
      newIP = await _getCurrentIP();
      _addLog("📍 Got IP: $newIP");

      if (attempts > 8) {
        _addLog("⚠ Max IP change attempts reached, using current IP");
        break;
      }

      // Add random delay between attempts if IP is not unique
      if (_usedIPs.contains(newIP) && newIP != "unknown") {
        int betweenDelay = random.nextInt(5) + 2;
        _addLog("⏱ Waiting $betweenDelay seconds before next IP change attempt...");
        await Future.delayed(Duration(seconds: betweenDelay));
      }
    } while (_usedIPs.contains(newIP) && newIP != "unknown");

    // Only add to used IPs if it's a valid IP
    if (newIP != "unknown") {
      _usedIPs.add(newIP);
      await _saveUsedIPs();
    }

    setState(() {
      _currentIP = newIP;
    });

    _addLog("✅ Using IP: $newIP (${_usedIPs.contains(newIP) ? 'reused' : 'new'})");

    // Add random delay after IP change
    int postDelay = random.nextInt(4) + 2;
    _addLog("⏱ Waiting $postDelay seconds after IP change...");
    await Future.delayed(Duration(seconds: postDelay));

    return true;
  }

// Add this helper method with timeout
  Future<bool> _waitForConnectionWithTimeout() async {
    _addLog("📶 Waiting for internet connection...");

    for (int i = 0; i < 15; i++) { // 30 seconds total (15 * 2)
      try {
        var connectivityResult = await Connectivity().checkConnectivity();
        if (connectivityResult != ConnectivityResult.none) {
          // Test actual internet connectivity with a shorter timeout
          try {
            final response = await http.get(Uri.parse('https://www.google.com'))
                .timeout(Duration(seconds: 3));
            if (response.statusCode == 200) {
              _addLog("✅ Internet connection restored");
              return true;
            }
          } catch (e) {
            // Continue waiting if HTTP request fails
          }
        }
      } catch (e) {
        // Continue waiting if connectivity check fails
      }
      await Future.delayed(Duration(seconds: 2));
    }

    _addLog("❌ Failed to restore connection after 30 seconds");
    return false;
  }

  Future<bool> _extractLinksFromYouTubeVideo() async {
    // Make sure the page is fully loaded and expanded
    await Future.delayed(Duration(seconds: 3));
    return await _extractClickThroughLinksFromYouTube();
  }

  String _extractUrlFromIntent(String intentUrl) {
    try {
      // Extract URL from intent://domain.com/path#Intent;scheme=https;...
      if (intentUrl.startsWith('intent://')) {
        // Remove 'intent://' prefix
        String withoutPrefix = intentUrl.substring(9);

        // Find the '#Intent' part and remove everything after it
        int intentIndex = withoutPrefix.indexOf('#Intent');
        if (intentIndex != -1) {
          String urlPart = withoutPrefix.substring(0, intentIndex);

          // Check if there's a scheme specified in the intent
          if (intentUrl.contains('scheme=https')) {
            return 'https://$urlPart';
          } else if (intentUrl.contains('scheme=http')) {
            return 'http://$urlPart';
          } else {
            // Default to https
            return 'https://$urlPart';
          }
        }
      }
      return '';
    } catch (e) {
      _addLog("❌ Error extracting URL from intent: $e");
      return '';
    }
  }

  Future<void> _enableAccessibilityService() async {
    try {
      const platform = MethodChannel('survey_automation/accessibility');
      await platform.invokeMethod('openAccessibilitySettings');
      _addLog("🔧 Opening accessibility settings...");
    } catch (e) {
      _addLog("❌ Failed to open accessibility settings: $e");
    }
  }

// REPLACE the entire _buildYouTubeLinksInput() method with this:
  Widget _buildYouTubeChannelsInput() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'YouTube Channels:',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        SizedBox(height: 8),
        ..._youtubeChannels
            .asMap()
            .entries
            .map((entry) {
          final index = entry.key;
          final channel = entry.value;
          return Padding(
            padding: EdgeInsets.only(bottom: 8),
            child: Card(
              child: Padding(
                padding: EdgeInsets.all(8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            'Channel ${index + 1}: ${channel.url.length > 30
                                ? channel.url.substring(0, 30) + '...'
                                : channel.url}',
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ),
                        IconButton(
                          icon: Icon(Icons.remove),
                          onPressed: () {
                            setState(() {
                              _youtubeChannels.removeAt(index);
                              _saveInputData();
                            });
                          },
                        ),
                      ],
                    ),
                    SizedBox(height: 4),
                    Text('Adrino ID: ${channel.adrinoId}'),
                  ],
                ),
              ),
            ),
          );
        }).toList(),
        Divider(),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _youtubeController,
                decoration: InputDecoration(
                  hintText: 'YouTube Channel URL',
                  border: OutlineInputBorder(),
                  isDense: true,
                ),
              ),
            ),
            SizedBox(width: 8),
            Expanded(
              child: TextField(
                controller: _adrinoIdController,
                decoration: InputDecoration(
                  hintText: 'Adrino ID',
                  border: OutlineInputBorder(),
                  isDense: true,
                ),
              ),
            ),
            SizedBox(width: 8),
            ElevatedButton(
              onPressed: () {
                if (_youtubeController.text.isNotEmpty &&
                    _adrinoIdController.text.isNotEmpty) {
                  setState(() {
                    _youtubeChannels.add(YouTubeChannel(
                      url: _youtubeController.text.trim(),
                      adrinoId: _adrinoIdController.text.trim(),
                    ));
                    _youtubeController.clear();
                    _adrinoIdController.clear();
                    _saveInputData();
                  });
                }
              },
              child: Text('Add Channel'),
            ),
          ],
        ),
      ],
    );
  }

  Future<bool> _toggleAirplaneModeWithAccessibility(bool enable) async {
    try {
      const platform = MethodChannel('survey_automation/accessibility');
      bool result = await platform.invokeMethod(
          'toggleAirplaneMode', {'enable': enable});
      _addLog("✈ Airplane mode ${enable
          ? 'enabled'
          : 'disabled'} via accessibility: $result");
      return result;
    } catch (e) {
      _addLog("❌ Failed to toggle airplane mode via accessibility: $e");
      return false;
    }
  }
  Future<void> _recoverFromAirplaneModeStuck() async {
    _addLog("🔄 Attempting to recover from airplane mode stuck state...");

    try {
      // Check current state
      bool isAirplaneModeOn = await AirplaneMacro.getState();
      _addLog("✈️ Current airplane mode state: ${isAirplaneModeOn ? 'ON' : 'OFF'}");

      if (isAirplaneModeOn) {
        _addLog("✈️ Airplane mode is ON, attempting to turn it OFF...");
        final offResult = await AirplaneMacro.toggle();
        _addLog("   → Toggle result: $offResult");

        await Future.delayed(Duration(seconds: 5));

        // Verify it's off
        isAirplaneModeOn = await AirplaneMacro.getState();
        if (isAirplaneModeOn) {
          _addLog("❌ Still stuck in airplane mode, trying alternative method...");

          // Try multiple times with delays
          for (int i = 0; i < 3; i++) {
            _addLog("🔄 Attempt ${i + 1}/3 to disable airplane mode...");
            await AirplaneMacro.toggle();
            await Future.delayed(Duration(seconds: 3));

            isAirplaneModeOn = await AirplaneMacro.getState();
            if (!isAirplaneModeOn) break;
          }
        }
      }

      // Final verification
      isAirplaneModeOn = await AirplaneMacro.getState();
      _addLog("✅ Airplane mode recovery completed. Final state: ${isAirplaneModeOn ? 'ON' : 'OFF'}");

    } catch (e) {
      _addLog("❌ Error recovering from airplane mode: $e");

      // Last resort: try accessibility service if available
      try {
        _addLog("🔄 Trying accessibility service as fallback...");
        const platform = MethodChannel('survey_automation/accessibility');
        await platform.invokeMethod('toggleAirplaneMode', {'enable': false});
        await Future.delayed(Duration(seconds: 5));
      } catch (accessError) {
        _addLog("❌ Accessibility fallback also failed: $accessError");
      }
    }
  }
  Future<bool> _isAirplaneModeStuck() async {
    try {
      // Check if airplane mode has been on for too long
      bool isAirplaneModeOn = await AirplaneMacro.getState();

      if (isAirplaneModeOn) {
        // If airplane mode is on for more than 30 seconds, consider it stuck
        // You might want to track the time when it was last toggled
        _addLog("⚠️ Airplane mode is ON - checking if stuck...");
        return true;
      }

      return false;
    } catch (e) {
      _addLog("❌ Error checking airplane mode state: $e");
      return false; // Assume not stuck if we can't check
    }
  }
  Future<bool> _processSurveyWithRetries(Map<String, dynamic> linkData) async {
    final String link = linkData['url'];
    final String surveyType = linkData['surveyType'];
    final String displayName = linkData['displayName'];
    for (_retryCount = 0; _retryCount < MAX_RETRIES; _retryCount++) {
      try {
        _addLog("🔄 Attempt ${_retryCount +
            1}/$MAX_RETRIES for [$displayName] $link");

        // First navigate to YouTube as referrer
        await _navigateToYouTube();
        await Future.delayed(Duration(seconds: 2));

        // Then navigate to survey link with enhanced protection
        await _navigateToSurveyLink(link);

        // Handle any navigation dialogs that might appear
        await _handleNavigationDialogs();

        // Inject ad blocker before interacting with the page (safe, idempotent)
        try {
          await _injectAdBlocker();
          // allow ad blocker to remove/close things
          await Future.delayed(Duration(seconds: 2));
          // best-effort call to remove existing ads/popups
          try {
            await _webController.runJavaScript(
                'window.flutterSurveyAdBlocker && window.flutterSurveyAdBlocker.removeExistingAds && window.flutterSurveyAdBlocker.removeExistingAds();');
          } catch (_) {}
          // refresh stats
          await _getAdBlockerStats();
        } catch (e) {
          _addLog("⚠️ Ad blocker injection failed (continuing): $e");
        }

        // Determine survey type and process accordingly (existing flow)
        _currentSurveyType = surveyType;
        _addLog("📊 Survey type detected: $_currentSurveyType ($displayName)");

        // Continue with existing processing functions (they will run faster with ads removed)
        bool success = await _processSurveyByType(link);

        if (success) {
          return true;
        }

        _addLog("❌ Attempt ${_retryCount + 1} failed, retrying...");
        await Future.delayed(Duration(seconds: 5));
      } catch (e) {
        _addLog("❌ Error in attempt ${_retryCount + 1}: $e");
      }
    }
    return false;
  }

// ADD this method to your _MainScreenState class:
  String _extractAdrinoIdFromUrl(String url) {
    try {
      Uri uri = Uri.parse(url);
      if (uri.host.contains('adrinolinks')) {
        // Extract ID from adrinolinks URL pattern
        if (uri.pathSegments.isNotEmpty) {
          return uri.pathSegments.last;
        }
      } else if (uri.host.contains('v2links')) {
        // Extract ID from v2links URL pattern
        if (uri.queryParameters.containsKey('id')) {
          return uri.queryParameters['id']!;
        }
      } else if (uri.host.contains('gplinks')) {
        // Extract ID from gplinks URL pattern
        if (uri.pathSegments.isNotEmpty) {
          return uri.pathSegments.last;
        }
      }
      return 'unknown';
    } catch (e) {
      return 'unknown';
    }
  }

  String _determineSurveyType(String link) {
    if (link.contains('adrinolinks')) return 'adrinolinks';
    if (link.contains('v2links')) return 'v2links';
    if (link.contains('gplinks')) return 'gplinks';
    return 'unknown';
  }

  Future<bool> _processSurveyByType(String link) async {
    switch (_currentSurveyType) {
      case 'adrinolinks':
        return await _processAdrinoLinks();
      case 'v2links':
        return await _processV2Links();
      case 'gplinks':
        return await _processGPLinks();
      default:
        return await _processGenericSurvey();
    }
  }
  void _logCompletionStatistics() {
    _addLog("📊 Completion Statistics Preview:");

    // Calculate completion statistics
    int totalCompletions = 0;
    int maxCompletions = 0;
    int minCompletions = _totalCycles;

    _linkCompletions.forEach((linkId, completions) {
      totalCompletions += completions;
      if (completions > maxCompletions) maxCompletions = completions;
      if (completions < minCompletions) minCompletions = completions;
    });

    final avgCompletions = _linkCompletions.isNotEmpty
        ? totalCompletions / _linkCompletions.length
        : 0;

    _addLog("   • Total cycles: $_totalCycles");
    _addLog("   • Unique IPs used: ${_usedIPs.length}");
    _addLog("   • Links processed: ${_linkCompletions.length}");
    _addLog("   • Total completions: $totalCompletions");
    _addLog("   • Average completions per link: ${avgCompletions.toStringAsFixed(1)}");
    _addLog("   • Min completions: $minCompletions");
    _addLog("   • Max completions: $maxCompletions");

    // Show completions by Adrino ID
    _addLog("   • Completions by Adrino ID:");
    _linkCompletions.forEach((linkId, completions) {
      _addLog("     - $linkId: $completions completions");
    });
  }
  Future<bool> _isWebViewStuck() async {
    try {
      Object? scrollData = await _webController.runJavaScriptReturningResult('''
      (function() {
        return {
          scrollY: window.scrollY,
          timestamp: Date.now()
        };
      })();
    ''');

      // Implement your logic to detect if the WebView is stuck
      // For example, check if scroll position hasn't changed in a while
      return false; // Replace with actual detection logic
    } catch (e) {
      return false;
    }
  }
  void _logCompletionSequence(List<Map<String, dynamic>> completionSequence) {
    _addLog("🔄 Completion Sequence Preview:");

    if (completionSequence.isEmpty) {
      _addLog("   No completions recorded yet");
      return;
    }

    // Show the most recent completions (last 5)
    int startIndex = completionSequence.length > 5 ? completionSequence.length - 5 : 0;

    for (int i = startIndex; i < completionSequence.length; i++) {
      var completion = completionSequence[i];

      // Format timestamp without using DateFormat
      String time = "Unknown time";
      if (completion['timestamp'] != null) {
        DateTime timestamp = completion['timestamp'];
        time = "${timestamp.hour.toString().padLeft(2, '0')}:"
            "${timestamp.minute.toString().padLeft(2, '0')}:"
            "${timestamp.second.toString().padLeft(2, '0')}";
      }

      _addLog("   ${i + 1}. ${completion['displayName']} - $time");
    }

    if (completionSequence.length > 5) {
      _addLog("   ... and ${completionSequence.length - 5} more completions");
    }
  }
  Future<bool> _processAdrinoLinks() async {
    _addLog("🔗 Processing Adrinolinks survey...");
    // Wait for initial page load
    await Future.delayed(Duration(seconds: 5));

    // Handle cloudflare verification
    await _handleCloudflareVerification();
    // Add this check in your survey processing loops
    if (await _isWebViewStuck()) {
      await _handleStuckWebView();
    }
    // Process steps 1-4
    for (int step = 1; step <= 4; step++) {
      if (!_isRunning) return false;
      _currentSurveyStep = step;
      _addLog("📍 Adrinolinks Step $step/4");
      // Add this check in your survey processing loops
      if (await _isWebViewStuck()) {
        await _handleStuckWebView();
      }
      // Wait for step page to load
      await Future.delayed(Duration(seconds: 3));

      // Wait for countdown
      await _waitForCountdown(step == 4 ? 6 : 10);

      // Close ads and popups
      await _closeAdsAndPopups();

      // Click continue button
      if (!await _clickContinueButton()) {
        _addLog("❌ Failed to find continue button in step $step");
        return false;
      }
      // Add this check in your survey processing loops
      if (await _isWebViewStuck()) {
        await _handleStuckWebView();
      }
      // Use enhanced scroll and click proceed method
      await _scrollAndClickProceed();

      // Wait longer for navigation to complete
      await Future.delayed(Duration(seconds: 5));

      // Verify step completion by checking URL or page content
      String currentUrl = await _webController.currentUrl() ?? "";
      _addLog("📍 After step $step, current URL: $currentUrl");

      // Wait between steps
      await Future.delayed(Duration(seconds: Random().nextInt(3) + 2));
    }
    // ADD THIS RIGHT BEFORE THE FINAL STEP
    // Log what would be shown in the completion dialog
    _logCompletionStatistics();

    // For the sequence, we need to pass the current completion sequence
    // You'll need to maintain this list throughout the automation
    _logCompletionSequence(_completionSequence);
    // Final step - get link with enhanced monitoring
    _addLog("🎯 Final step: Getting download link...");
    setState(() {
      _currentStep =
      "${_currentStep.split(':')[0]}: Final step - Getting link...";
    });

    // Show webview during final step so user can see the result
    setState(() {
      _showWebView = true;
    });
    return await _verifyFinalDestination();
  }

  Future<bool> _processV2Links() async {
    _addLog("🔗 Processing V2Links survey...");
    await Future.delayed(Duration(seconds: 5));
    await _handleCloudflareVerification();

    // Process steps 1-3
    for (int step = 1; step <= 3; step++) {
      if (!_isRunning) return false;
      _currentSurveyStep = step;
      _addLog("📍 Step $step/3");

      // Click verify button
      await _clickVerifyButton();

      // Wait for countdown (18-25 seconds)
      await _waitForCountdown(18 + Random().nextInt(7));

      // Scroll and click continue
      await _scrollAndClickContinue();
      await Future.delayed(Duration(seconds: Random().nextInt(3) + 2));
    }

    // Final step
    await _clickGetLinkButton();
    return await _verifyFinalDestination();
  }

  Future<bool> _processGPLinks() async {
    _addLog("🔗 Processing GPLinks survey...");

    // Wait for initial page load
    await Future.delayed(Duration(seconds: 3));

    // Enhanced handling for GPLinks specific flow
    await _handleGPLinksFlow();

    // Process steps 1-2 (only if we successfully pass verification)
    for (int step = 1; step <= 2; step++) {
      if (!_isRunning) return false;
      _currentSurveyStep = step;
      _addLog("📍 GPLinks Step $step/2");

      // Wait for countdown (15-20 seconds)
      await _waitForCountdown(15 + Random().nextInt(5));

      // Close ads and click continue
      await _closeAdsAndPopups();
      await _scrollAndClickContinue();
      await Future.delayed(Duration(seconds: Random().nextInt(3) + 2));
    }

    // Final step
    await _clickGetLinkButton();
    return await _verifyFinalDestination();
  }


  Future<bool> _processGenericSurvey() async {
    _addLog("🔗 Processing generic survey...");
    await Future.delayed(Duration(seconds: 5));

    // Basic generic processing
    for (int step = 1; step <= 3; step++) {
      if (!_isRunning) return false;
      _addLog("📍 Generic step $step/3");

      await Future.delayed(Duration(seconds: 10));
      await _closeAdsAndPopups();
      await _scrollAndClickContinue();
      await Future.delayed(Duration(seconds: Random().nextInt(3) + 2));
    }

    return true;
  }

  Future<void> _navigateToYouTube() async {
    try {
      await _webController.loadRequest(Uri.parse(_youtubeController.text));
      await Future.delayed(Duration(seconds: 5));
      _addLog("🎬 Loaded YouTube as referrer");

      // Ensure page is fully loaded and interactive
      await _webController.runJavaScript('''
      // Scroll to description to make sure it's loaded
      const descElement = document.querySelector('#description, #meta-contents');
      if (descElement) {
        descElement.scrollIntoView({behavior: 'smooth'});
      }
    ''');

      await Future.delayed(Duration(seconds: 2));
    } catch (e) {
      _addLog("❌ Failed to load YouTube: $e");
    }
  }

  Future<void> _navigateToSurveyLink(String link) async {
    try {
      _addLog("🔗 Navigating to survey link with enhanced protection...");
      _addLog("🎯 Using link: $link");

      // Pre-inject enhanced dialog blocking
      await _injectDialogBlockerComplete();

      // Set up navigation monitoring
      bool navigationStarted = false;

      // Enhanced navigation with automatic dialog handling
      await _webController.runJavaScript('''
      (function() {
        console.log('🛡️ Setting up navigation protection...');
        
        // Enhanced beforeunload blocking
        window.onbeforeunload = null;
        
        // Override confirm dialogs specifically for navigation
        var originalConfirm = window.confirm;
        window.confirm = function(message) {
          console.log('🤖 Auto-confirmed navigation dialog: ' + message);
          if (message.includes('navigate') || message.includes('leave') || message.includes('changes')) {
            return true; // Auto-confirm navigation
          }
          return true;
        };
        
        // Disable page unload warnings
        window.addEventListener('beforeunload', function(e) {
          delete e['returnValue'];
          e.preventDefault();
          return undefined;
        }, true);
        
        console.log('✅ Navigation protection active');
      })();
    ''');

      // Navigate to the survey link
      if (link.contains('youtube.com/redirect')) {
        _addLog("✅ Using YouTube redirect link (maintains referrer)");
        await _webController.loadRequest(Uri.parse(link));
      } else {
        _addLog("⚠️ Direct link detected, adding referrer header simulation");
        await _webController.loadRequest(Uri.parse(link));
      }

      navigationStarted = true;
      _addLog("🚀 Navigation initiated...");

      // Immediate dialog blocking reinforcement
      await Future.delayed(Duration(seconds: 1));
      await _injectDialogBlockerComplete();

      // Monitor for dialog popups and handle them
      for (int i = 0; i < 5; i++) {
        await _webController.runJavaScript('''
        (function() {
          // Force close any navigation confirmation dialogs
          try {
            var confirmButtons = document.querySelectorAll('[onclick*="confirm"], button[onclick*="ok"], [value*="Leave"], [value*="OK"]');
            confirmButtons.forEach(function(btn) {
              if (btn.offsetParent !== null) {
                console.log('🤖 Auto-clicking confirmation button: ' + (btn.textContent || btn.value));
                btn.click();
              }
            });
            
            // Handle specific "Leave this Page" dialogs
            var leaveButtons = document.querySelectorAll('button, input[type="button"]');
            leaveButtons.forEach(function(btn) {
              var text = (btn.textContent || btn.value || '').toLowerCase();
              if (text.includes('leave') || text.includes('continue') || text === 'ok') {
                console.log('🤖 Auto-clicking leave button: ' + text);
                btn.click();
              }
            });
            
          } catch(e) {
            console.log('Dialog handling error:', e);
          }
        })();
      ''');

        await Future.delayed(Duration(seconds: 1));
      }

      await Future.delayed(Duration(seconds: 3));
      _addLog("🔗 Survey link loaded with enhanced dialog protection");
    } catch (e) {
      _addLog("❌ Failed to load survey link: $e");
    }
  }

  Future<void> _handleCloudflareVerification() async {
    _addLog("🛡 Starting enhanced Cloudflare & redirect handling...");

    try {
      // Wait for initial page load
      await Future.delayed(Duration(seconds: 3));

      // Enhanced Cloudflare detection and handling
      for (int attempt = 1; attempt <= 10; attempt++) {
        if (!_isRunning) return;

        String currentUrl = await _webController.currentUrl() ?? "";
        _addLog("🔍 Attempt $attempt - Current URL: $currentUrl");

        // Check page content and handle different scenarios
        Object? pageAnalysis = await _webController
            .runJavaScriptReturningResult('''
        (function() {
          var bodyText = document.body.textContent || document.body.innerText || '';
          var hasCloudflare = bodyText.includes('Checking your browser') || 
                             bodyText.includes('DDoS protection') ||
                             bodyText.includes('Verifying you are human') ||
                             bodyText.includes('CLOUDFLARE') ||
                             bodyText.includes('Privacy Terms') ||
                             document.querySelector('.cf-browser-verification') !== null ||
                             document.querySelector('[data-ray]') !== null;
          
          var hasRedirecting = bodyText.includes('Redirecting...') ||
                              bodyText.includes('If you are not redirected') ||
                              bodyText.includes('click here');
          
          var hasVerifyButton = document.querySelector('input[type="button"]') !== null ||
                               document.querySelector('button') !== null ||
                               document.querySelector('.cf-turnstile') !== null;
          
          var isProcinehub = window.location.href.includes('procinehub') || 
                            bodyText.includes('procinehub');
          
          return JSON.stringify({
            hasCloudflare: hasCloudflare,
            hasRedirecting: hasRedirecting,
            hasVerifyButton: hasVerifyButton,
            isProcinehub: isProcinehub,
            bodyLength: bodyText.length,
            url: window.location.href,
            title: document.title
          });
        })();
      ''');

        String analysisStr = pageAnalysis?.toString() ?? '';
        _addLog("📊 Page analysis: $analysisStr");

        // Handle different page types
        if (analysisStr.contains('"hasCloudflare":true')) {
          _addLog(
              "🛡 Cloudflare verification detected - attempting auto-solve...");

          // Try to click verification elements
          await _webController.runJavaScript('''
          (function() {
            console.log('🤖 Attempting Cloudflare auto-solve...');
            
            // Method 1: Click Cloudflare turnstile checkbox
            var turnstile = document.querySelector('.cf-turnstile input[type="checkbox"]');
            if (turnstile && !turnstile.checked) {
              console.log('✅ Found Cloudflare turnstile, clicking...');
              turnstile.click();
              return;
            }
            
            // Method 2: Click verify button
            var verifyBtn = document.querySelector('input[type="button"][value*="Verify"], button[type="submit"]');
            if (verifyBtn) {
              console.log('✅ Found verify button, clicking...');
              verifyBtn.click();
              return;
            }
            
            // Method 3: Click any button on Cloudflare page
            var buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"]');
            for (var i = 0; i < buttons.length; i++) {
              var btn = buttons[i];
              if (btn.offsetParent !== null) {
                console.log('✅ Clicking available button:', btn.textContent || btn.value);
                btn.click();
                break;
              }
            }
            
            // Method 4: Try to trigger automatic verification
            if (window.cf && window.cf.challenge) {
              console.log('🎯 Triggering CF challenge completion...');
              try {
                window.cf.challenge.execute();
              } catch(e) {
                console.log('CF challenge trigger failed:', e);
              }
            }
          })();
        ''');

          _addLog("🤖 Cloudflare auto-solve attempted, waiting...");
          await Future.delayed(Duration(seconds: 8));
        } else if (analysisStr.contains('"hasRedirecting":true')) {
          _addLog("🔄 Redirecting page detected - forcing redirect...");

          // Force redirect by clicking redirect link
          await _webController.runJavaScript('''
          (function() {
            // Look for redirect links
            var links = document.querySelectorAll('a[href], a');
            for (var i = 0; i < links.length; i++) {
              var link = links[i];
              var linkText = (link.textContent || '').toLowerCase();
              if (linkText.includes('click here') || linkText.includes('continue') || link.href) {
                console.log('🔄 Clicking redirect link:', link.href || link.textContent);
                link.click();
                return;
              }
            }
            
            // If no links, try to reload or go back
            console.log('🔄 No redirect links found, reloading...');
            window.location.reload();
          })();
        ''');

          await Future.delayed(Duration(seconds: 5));
        } else {
          // Check if we've moved to the actual survey page - FIXED VERSION
          if (currentUrl.isNotEmpty &&
              !currentUrl.toLowerCase().contains('cloudflare') &&
              !currentUrl.toLowerCase().contains('procinehub') &&
              analysisStr.isNotEmpty &&
              analysisStr.contains('"bodyLength"') &&
              !analysisStr.contains('"bodyLength":0')) {
            _addLog("✅ Successfully passed verification, continuing...");
            break;
          }
        }

        // Wait before next attempt
        await Future.delayed(Duration(seconds: 3));

        // If we're stuck on the same verification page for too long, try refresh
        if (attempt == 5) {
          _addLog("🔄 Refreshing page to retry verification...");
          await _webController.reload();
          await Future.delayed(Duration(seconds: 5));
        }
      }

      _addLog("🛡 Cloudflare & redirect handling completed");
    } catch (e) {
      _addLog("❌ Enhanced Cloudflare handling error: $e");
    }
  }

  Future<void> _waitForCountdown(int seconds) async {
    _addLog("⏱ Waiting for countdown: $seconds seconds");
    for (int i = seconds; i > 0; i--) {
      if (!_isRunning) return;
      setState(() {
        _currentStep = "${_currentStep.split(':')[0]}: Countdown $i";
      });
      await Future.delayed(Duration(seconds: 1));
    }
  }

  Future<void> _closeAdsAndPopups() async {
    _addLog("🚫 Starting enhanced ad popup closing with Skip detection");
    // TEMPORARY DEBUG CODE - Remove after getting HTML structure
    try {
      Object? htmlStructure = await _webController.runJavaScriptReturningResult(
          '''
    (function() {
      // Get main page HTML
      var mainHTML = document.documentElement.outerHTML;
      
      // Get iframe contents if any
      var iframes = document.querySelectorAll('iframe');
      var iframeContents = [];
      
      for (var i = 0; i < iframes.length; i++) {
        try {
          var iframeDoc = iframes[i].contentDocument || iframes[i].contentWindow.document;
          if (iframeDoc) {
            iframeContents.push({
              src: iframes[i].src,
              html: iframeDoc.documentElement.outerHTML
            });
          }
        } catch(e) {
          iframeContents.push({
            src: iframes[i].src,
            error: e.toString()
          });
        }
      }
      
      return JSON.stringify({
        mainHTML: mainHTML.substring(0, 5000), // First 5000 chars
        iframes: iframeContents,
        currentURL: window.location.href
      });
    })();
  ''');

      _addLog("🔍 DEBUG HTML STRUCTURE: ${htmlStructure.toString().substring(
          0, 1000)}");
    } catch (e) {
      _addLog("❌ DEBUG HTML capture failed: $e");
    }
    try {
      await _webController.runJavaScript('''
      // Enhanced ad popup closing with video ad support
      var closeSelectors = [
        // Standard close buttons
        '[class*="close"]', '[id*="close"]',
        '[class*="dismiss"]', '[id*="dismiss"]',
        '.popup-close', '.modal-close',
        '[aria-label*="close"]', '[title*="close"]',
        'button[onclick*="close"]',
        
        // Video ad specific selectors
        '.video-close', '.ad-close', '.player-close',
        '[class*="video"][class*="close"]',
        '[id*="video"][id*="close"]',
        '.overlay-close', '.ad-overlay-close',
        
        // X button variations for video ads
        'button[title="Close"]', 'button[aria-label="Close"]',
        '.close-btn', '.close-button', '.btn-close',
        '[data-dismiss="modal"]', '[data-close="popup"]',
        
        // Skip button selectors (for second popup)
        'button[onclick*="skip"]', '[class*="skip"]',
        'button:contains("Skip")', '[value*="skip"]',
        '.skip-btn', '.skip-button'
      ];
      
      // First pass: Close video ads and standard popups
      closeSelectors.forEach(function(selector) {
        var elements = document.querySelectorAll(selector);
        elements.forEach(function(el) {
          if (el.offsetParent !== null && el.style.display !== 'none') {
            try {
              el.click();
            } catch(e) {}
          }
        });
      });
      
      // Enhanced Skip/Resume dialog handling - specifically for Google AdSense video ads
      setTimeout(function() {
        var skipFound = false;
        console.log('🎯 Starting Google AdSense video ad Skip detection...');
      
        // Method 1: Check for Google AdSense video ad Skip buttons in iframes
        var iframes = document.querySelectorAll('iframe');
        console.log('🔍 Found', iframes.length, 'iframes to check');
        
        for (var i = 0; i < iframes.length && !skipFound; i++) {
          try {
            var iframe = iframes[i];
            var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            
            if (iframeDoc) {
              console.log('🎯 Checking iframe', i, 'src:', iframe.src);
              
              // Look for Skip buttons in iframe
              var skipButtons = iframeDoc.querySelectorAll('*');
              for (var j = 0; j < skipButtons.length; j++) {
                var element = skipButtons[j];
                var text = (element.textContent || element.innerText || '').trim();
                
                if ((text === 'Skip' || text === 'SKIP' || text === 'Skip Ad' || text === 'Skip Video') && 
                    (element.tagName === 'BUTTON' || element.onclick || element.style.cursor === 'pointer')) {
                  
                  console.log('🎯 Found Skip button in iframe:', text, element.tagName);
                  
                  try {
                    // Multiple click attempts
                    element.click();
                    
                    var clickEvent = new MouseEvent('click', {
                      view: iframe.contentWindow,
                      bubbles: true,
                      cancelable: true
                    });
                    element.dispatchEvent(clickEvent);
                    
                    skipFound = true;
                    console.log('✅ Skip button clicked in iframe');
                    break;
                  } catch(clickError) {
                    console.log('❌ Iframe Skip click failed:', clickError);
                  }
                }
              }
            }
          } catch(iframeError) {
            console.log('❌ Iframe access failed:', iframeError);
          }
        }
      
        // Method 2: Look for Google AdSense specific selectors
        if (!skipFound) {
          var googleAdSelectors = [
            '[id*="google_ads_iframe"]',
            '[class*="google-ads"]',
            '[id*="goog"]',
            '[class*="goog"]'
          ];
          
          for (var k = 0; k < googleAdSelectors.length && !skipFound; k++) {
            var adContainers = document.querySelectorAll(googleAdSelectors[k]);
            console.log('🔍 Checking Google Ad selector:', googleAdSelectors[k], 'found:', adContainers.length);
            
            for (var l = 0; l < adContainers.length; l++) {
              var container = adContainers[l];
              var skipInContainer = container.querySelectorAll('*');
              
              for (var m = 0; m < skipInContainer.length; m++) {
                var element = skipInContainer[m];
                var text = (element.textContent || element.innerText || '').trim();
                
                if (text === 'Skip' || text === 'SKIP') {
                  try {
                    console.log('🎯 Found Skip in Google Ad container');
                    element.click();
                    skipFound = true;
                    break;
                  } catch(e) {}
                }
              }
              if (skipFound) break;
            }
          }
        }
      
        // Method 3: Force close video ad containers
        if (!skipFound) {
          console.log('🧹 Force closing video ad containers...');
          
          var videoAdContainers = document.querySelectorAll('[id*="video"], [class*="video"], [id*="ad"], [class*="ad"]');
          for (var n = 0; n < videoAdContainers.length; n++) {
            var container = videoAdContainers[n];
            var containerText = (container.textContent || '').toLowerCase();
            
            if (containerText.includes('skip') || containerText.includes('resume')) {
              container.style.display = 'none';
              container.remove();
              console.log('🧹 Removed video ad container');
            }
          }
        }
      }, 300);
      
      // Second attempt: Target newly appeared Skip dialogs
      setTimeout(function() {
        console.log('🔄 Second attempt: Looking for newly appeared Skip dialogs...');
        
        // Look for Skip buttons in recently shown elements
        var recentElements = document.querySelectorAll('[style*="block"], [style*="visible"], .show, .active');
        for (var i = 0; i < recentElements.length; i++) {
          var element = recentElements[i];
          
          // Check if this element or its children contain Skip button
          var skipButtons = element.querySelectorAll('button, div, span, a');
          for (var j = 0; j < skipButtons.length; j++) {
            var btn = skipButtons[j];
            var btnText = (btn.textContent || btn.innerText || '').trim();
            
            if (btnText === 'Skip' || btnText === 'SKIP') {
              try {
                console.log('🎯 Second attempt: Found Skip in recently shown element');
                btn.click();
                
                // Force event dispatch
                var clickEvent = new MouseEvent('click', {
                  view: window,
                  bubbles: true,
                  cancelable: true
                });
                btn.dispatchEvent(clickEvent);
                
                console.log('✅ Second attempt Skip successful');
                return;
              } catch(e) {
                console.log('❌ Second attempt failed:', e);
              }
            }
          }
        }
      }, 800);

      // Third attempt: XPath-based Skip detection with better targeting
      setTimeout(function() {
        console.log('🔍 Third attempt: XPath-based Skip detection...');
        
        try {
          // More precise XPath for Skip buttons
          var xpaths = [
            "//button[text()='Skip']",
            "//button[text()='SKIP']", 
            "//div[text()='Skip' and (@onclick or @class)]",
            "//span[text()='Skip' and parent::button]",
            "//*[text()='Skip' and (name()='button' or @onclick or contains(@class, 'btn'))]"
          ];
          
          for (var k = 0; k < xpaths.length; k++) {
            var result = document.evaluate(xpaths[k], document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            if (result.singleNodeValue) {
              try {
                console.log('🎯 XPath found Skip button:', xpaths[k]);
                var element = result.singleNodeValue;
                
                // Ensure visibility
                element.style.display = 'block';
                element.style.visibility = 'visible';
                
                element.click();
                console.log('✅ XPath Skip click successful');
                return;
              } catch(e) {
                console.log('❌ XPath click failed:', e);
              }
            }
          }
        } catch(e) {
          console.log('❌ XPath evaluation failed:', e);
        }
      }, 1200);
      
      // Fourth attempt: Persistent Skip dialog detection
      setTimeout(function() {
        console.log('🔄 Fourth attempt: Persistent Skip dialog detection...');

        // Target Skip buttons that might have delayed appearance
        var persistentSkipButtons = document.querySelectorAll('button, div, span, a');
        for (var i = 0; i < persistentSkipButtons.length; i++) {
          var element = persistentSkipButtons[i];
          var text = (element.textContent || element.innerText || '').trim();
          
          if (text === 'Skip' && element.offsetParent !== null) {
            // Additional checks for Skip Video dialog context
            var isInVideoDialog = false;
            var currentElement = element;
            
            // Check element and parents for video dialog indicators
            for (var j = 0; j < 3; j++) {
              if (currentElement) {
                var elementText = (currentElement.textContent || '').toLowerCase();
                var elementClass = (currentElement.className || '').toLowerCase();
                
                if (elementText.includes('skip video') || 
                    elementText.includes('resume') ||
                    elementClass.includes('video') ||
                    elementClass.includes('dialog') ||
                    currentElement.style.position === 'fixed' ||
                    currentElement.style.zIndex > 999) {
                  isInVideoDialog = true;
                  break;
                }
                currentElement = currentElement.parentElement;
              }
            }
            
            if (isInVideoDialog || element.tagName === 'BUTTON') {
              try {
                console.log('🎯 Fourth attempt: Found persistent Skip button');
                
                // Aggressive click sequence
                element.focus();
                element.click();
                
                // Simulate user interaction
                var mouseEvents = ['mousedown', 'mouseup', 'click'];
                mouseEvents.forEach(function(eventType) {
                  var event = new MouseEvent(eventType, {
                    view: window,
                    bubbles: true,
                    cancelable: true,
                    button: 0
                  });
                  element.dispatchEvent(event);
                });
                
                console.log('✅ Fourth attempt Skip successful');
                break;
              } catch(e) {
                console.log('❌ Fourth attempt failed:', e);
              }
            }
          }
        }
      }, 1800);

      // Fifth pass: Force close stubborn video ads and dialogs
      setTimeout(function() {
        console.log('🧹 Fifth pass: Force closing stubborn video ads...');
        
        // Remove video ad containers entirely if they're still visible
        var videoAdSelectors = [
          '[class*="video-ad"]', '[id*="video-ad"]', '[class*="ad-video"]',
          '[class*="video-overlay"]', '[id*="video-overlay"]',
          '[class*="ad-overlay"]', '[id*="ad-overlay"]'
        ];
        
        videoAdSelectors.forEach(function(selector) {
          var ads = document.querySelectorAll(selector);
          ads.forEach(function(ad) {
            if (ad.offsetParent !== null) {
              ad.style.display = 'none';
              ad.remove();
            }
          });
        });

        // Remove any remaining modal/popup overlays with Skip/Resume content
        var modals = document.querySelectorAll('.modal, .popup, [class*="overlay"], [class*="dialog"]');
        modals.forEach(function(modal) {
          var modalText = (modal.textContent || '').toLowerCase();
          if (modal.offsetParent !== null &&
              (modal.style.zIndex > 1000 || 
               modal.classList.contains('show') ||
               modalText.includes('skip') ||
               modalText.includes('resume'))) {
            modal.style.display = 'none';
            modal.remove();
          }
        });
        
        console.log('🧹 Stubborn ad cleanup completed');
      }, 2500);

      // Final attempt: Ultimate Skip button detection
      setTimeout(function() {
        console.log('🎯 Final attempt: Ultimate Skip button detection...');
        
        // Last resort: Find any remaining Skip buttons with maximum effort
        var finalElements = document.querySelectorAll('*');
        for (var i = 0; i < finalElements.length; i++) {
          var el = finalElements[i];
          var text = (el.textContent || el.innerText || '').trim();
          
          if (text === 'Skip' || text === 'SKIP') {
            var isClickableElement = el.tagName === 'BUTTON' || 
                                   el.onclick || 
                                   el.getAttribute('onclick') ||
                                   el.style.cursor === 'pointer' ||
                                   el.getAttribute('role') === 'button';
            
            if (isClickableElement) {
              try {
                console.log('🎯 Final attempt: Found ultimate Skip button');
                
                // Force element to be interactive
                el.style.pointerEvents = 'auto';
                el.style.display = 'block';
                el.style.visibility = 'visible';
                
                // Multiple click strategies
                el.click();
                el.dispatchEvent(new Event('click', { bubbles: true }));
                
                // Keyboard activation as backup
                el.dispatchEvent(new KeyboardEvent('keydown', { 
                  key: 'Enter', 
                  keyCode: 13, 
                  bubbles: true 
                }));
                
                console.log('✅ Final Skip attempt successful');
                break;
              } catch(e) {
                console.log('❌ Final attempt failed:', e);
              }
            }
          }
        }
      }, 3500);
    ''');

      _addLog("🚫 Enhanced ad popup closing executed");
    } catch (e) {
      _addLog("⚠ Ad popup closing error: $e");
    }
  }

  Future<void> _handleNavigationDialogs() async {
    _addLog("🚫 Handling navigation confirmation dialogs...");

    try {
      await _webController.runJavaScript('''
      (function() {
        console.log('🤖 Starting navigation dialog handler...');
        
        // Function to handle confirmation dialogs
        function handleConfirmationDialogs() {
          // Look for "Leave this Page" / "Stay on this Page" buttons
          var buttons = document.querySelectorAll('button, input[type="button"], [role="button"]');
          
          for (var i = 0; i < buttons.length; i++) {
            var btn = buttons[i];
            var text = (btn.textContent || btn.value || '').trim().toLowerCase();
            
            // Auto-click "Leave" or "Continue" buttons
            if (text.includes('leave this page') || 
                text.includes('leave page') ||
                text.includes('continue') ||
                text.includes('proceed') ||
                text === 'ok' ||
                text === 'yes') {
              
              console.log('🤖 Auto-clicking navigation button: ' + text);
              btn.click();
              return true;
            }
          }
          
          // Handle modal dialogs
          var modals = document.querySelectorAll('[role="dialog"], .modal, .popup');
          for (var j = 0; j < modals.length; j++) {
            var modal = modals[j];
            if (modal.offsetParent !== null) {
              var modalText = modal.textContent.toLowerCase();
              if (modalText.includes('navigate away') || modalText.includes('changes may not be saved')) {
                // Find and click the "Leave" button in this modal
                var modalButtons = modal.querySelectorAll('button');
                for (var k = 0; k < modalButtons.length; k++) {
                  var modalBtn = modalButtons[k];
                  var btnText = modalBtn.textContent.toLowerCase();
                  if (btnText.includes('leave') || btnText.includes('continue')) {
                    console.log('🤖 Auto-clicking modal leave button');
                    modalBtn.click();
                    return true;
                  }
                }
              }
            }
          }
          
          return false;
        }
        
        // Run immediately
        handleConfirmationDialogs();
        
        // Set up mutation observer to catch new dialogs
        if (window.MutationObserver) {
          var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
              if (mutation.addedNodes.length > 0) {
                setTimeout(handleConfirmationDialogs, 100);
              }
            });
          });
          
          observer.observe(document.body, {
            childList: true,
            subtree: true
          });
          
          // Stop observing after 30 seconds
          setTimeout(function() {
            observer.disconnect();
          }, 30000);
        }
        
        console.log('✅ Navigation dialog handler active');
      })();
    ''');

      _addLog("✅ Navigation dialog handler activated");
    } catch (e) {
      _addLog("❌ Error setting up navigation dialog handler: $e");
    }
  }

  Future<bool> _clickContinueButton() async {
    try {
      Object? result = await _webController.runJavaScriptReturningResult('''
        (function() {
          var continueSelectors = [
            'button:contains("Continue")', 'a:contains("Continue")',
            'button:contains("Next")', 'a:contains("Next")',
            'button:contains("Proceed")', 'a:contains("Proceed")',
            '.continue-btn', '.next-btn', '.proceed-btn',
            '#continue', '#next', '#proceed'
          ];
          
          for (var selector of continueSelectors) {
            var buttons = document.querySelectorAll('button, a, input[type="submit"]');
            for (var btn of buttons) {
              if (btn.textContent && 
                  (btn.textContent.toLowerCase().includes('continue') ||
                   btn.textContent.toLowerCase().includes('next') ||
                   btn.textContent.toLowerCase().includes('proceed'))) {
                btn.click();
                return true;
              }
            }
          }
          return false;
        })();
      ''');

      bool clicked = result.toString() == 'true';
      if (clicked) {
        _addLog("✅ Clicked continue button");
      }
      return clicked;
    } catch (e) {
      _addLog("❌ Error clicking continue: $e");
      return false;
    }
  }

  Future<void> _scrollAndClickProceed() async {
    try {
      _addLog("📜 Scrolling and looking for proceed button...");

      await _webController.runJavaScript('''
      (function() {
        console.log('🔍 Starting enhanced proceed button detection...');
        
        // First, scroll to bottom to ensure all content is loaded
        window.scrollTo(0, document.body.scrollHeight);
        
        // Function to find and click proceed button with multiple strategies
        function findAndClickProceedButton() {
          console.log('🎯 Searching for proceed button...');
          
          // Strategy 1: Look for the specific button ID and class from HTML structure
          var specificButton = document.querySelector('#tp-snp2.tp-btn-2.tp-blue');
          if (specificButton && specificButton.offsetParent !== null) {
            console.log('✅ Found specific tp-snp2 button');
            specificButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(function() {
              specificButton.click();
              console.log('✅ Clicked tp-snp2 button');
            }, 500);
            return true;
          }
          
          // Strategy 2: Look for buttons with exact text matches (case insensitive)
          var exactTextPatterns = [
            'click here to proceed',
            'click here to continue', 
            'proceed to next step',
            'continue to next page',
            'next step'
          ];
          
          var allButtons = document.querySelectorAll('button, a, input[type="submit"], div[onclick], span[onclick]');
          console.log('🔍 Found', allButtons.length, 'clickable elements');
          
          for (var i = 0; i < allButtons.length; i++) {
            var btn = allButtons[i];
            var btnText = (btn.textContent || btn.innerText || btn.value || '').trim().toLowerCase();
            
            if (btnText && btn.offsetParent !== null) {
              for (var j = 0; j < exactTextPatterns.length; j++) {
                if (btnText === exactTextPatterns[j]) {
                  console.log('✅ Found exact match button:', btnText);
                  btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  setTimeout(function() {
                    btn.click();
                    // Also trigger form submission if button is in a form
                    var form = btn.closest('form');
                    if (form && form.name === 'tp') {
                      console.log('📋 Also submitting form tp');
                      form.submit();
                    }
                    console.log('✅ Clicked exact match button');
                  }, 500);
                  return true;
                }
              }
            }
          }
          
          // Strategy 3: Look for buttons with partial text matches
          var partialTextPatterns = [
            'click here to proceed',
            'click to proceed',
            'proceed',
            'continue',
            'next',
            'get link',
            'download'
          ];
          
          for (var i = 0; i < allButtons.length; i++) {
            var btn = allButtons[i];
            var btnText = (btn.textContent || btn.innerText || btn.value || '').trim().toLowerCase();
            
            if (btnText && btn.offsetParent !== null) {
              for (var j = 0; j < partialTextPatterns.length; j++) {
                if (btnText.includes(partialTextPatterns[j])) {
                  console.log('✅ Found partial match button:', btnText);
                  btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  setTimeout(function() {
                    btn.click();
                    console.log('✅ Clicked partial match button');
                  }, 500);
                  return true;
                }
              }
            }
          }
          
          // Strategy 4: Look for form submission buttons
          var forms = document.querySelectorAll('form[name="tp"], form[action*="adrinoo"]');
          for (var i = 0; i < forms.length; i++) {
            var form = forms[i];
            var formButtons = form.querySelectorAll('button, input[type="submit"]');
            if (formButtons.length > 0) {
              var btn = formButtons[formButtons.length - 1]; // Get last button in form
              if (btn.offsetParent !== null) {
                console.log('✅ Found form submission button in tp form');
                btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(function() {
                  btn.click();
                  console.log('✅ Clicked form submission button');
                }, 500);
                return true;
              }
            }
          }
          
          // Strategy 5: Look for any blue buttons (tp-blue class)
          var blueButtons = document.querySelectorAll('.tp-blue, .tp-btn-2, [class*="blue"]');
          for (var i = 0; i < blueButtons.length; i++) {
            var btn = blueButtons[i];
            if (btn.offsetParent !== null && (btn.tagName === 'BUTTON' || btn.onclick || btn.getAttribute('onclick'))) {
              console.log('✅ Found blue button');
              btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
              setTimeout(function() {
                btn.click();
                console.log('✅ Clicked blue button');
              }, 500);
              return true;
            }
          }
          
          console.log('❌ No proceed button found with any strategy');
          return false;
        }
        
        // Initial attempt after scrolling
        setTimeout(function() {
          var found = findAndClickProceedButton();
          if (!found) {
            console.log('🔄 First attempt failed, trying again after more scrolling...');
            // Scroll up a bit and then down again to trigger any lazy loading
            window.scrollTo(0, document.body.scrollHeight * 0.8);
            setTimeout(function() {
              window.scrollTo(0, document.body.scrollHeight);
              setTimeout(function() {
                findAndClickProceedButton();
              }, 1500);
            }, 1000);
          }
        }, 2000); // Increased wait time for page to load
        
        console.log('🔍 Enhanced proceed button detection setup complete');
      })();
    ''');

      _addLog("📜 Enhanced scroll and proceed button detection initiated");

      // Wait for the JavaScript to complete its attempts
      await Future.delayed(Duration(seconds: 8));

      // Verify if we successfully clicked the button by checking URL change
      String currentUrl = await _webController.currentUrl() ?? "";
      _addLog("📍 Current URL after proceed attempt: $currentUrl");
    } catch (e) {
      _addLog("❌ Error in enhanced scroll and proceed: $e");
    }
  }


  Future<bool> _clickVerifyButton() async {
    try {
      Object? result = await _webController.runJavaScriptReturningResult('''
        (function() {
          var buttons = document.querySelectorAll('button, a, input[type="submit"]');
          for (var btn of buttons) {
            if (btn.textContent && 
                (btn.textContent.toLowerCase().includes('verify') ||
                 btn.textContent.toLowerCase().includes('check'))) {
              btn.click();
              return true;
            }
          }
          return false;
        })();
      ''');

      bool clicked = result.toString() == 'true';
      if (clicked) {
        _addLog("✅ Clicked verify button");
      }
      return clicked;
    } catch (e) {
      _addLog("❌ Error clicking verify: $e");
      return false;
    }
  }

  Future<void> _handleGPLinksFlow() async {
    _addLog("🔗 Starting intelligent GPLinks flow handling...");

    try {
      // Let the intelligent page handler do the work
      // Just monitor for completion
      for (int attempt = 1; attempt <= 20; attempt++) {
        if (!_isRunning) return;

        String currentUrl = await _webController.currentUrl() ?? "";

        // Check if we've successfully reached the final survey page
        if (currentUrl.isNotEmpty &&
            !currentUrl.contains('get2.in') &&
            !currentUrl.contains('gplinks.co') &&
            currentUrl.contains('procinehub.com')) {
          // Double check it's not still on Cloudflare
          Object? finalCheck = await _webController
              .runJavaScriptReturningResult('''
          (function() {
            var bodyText = document.body.textContent || document.body.innerText || '';
            var isCloudflare = bodyText.includes('Verifying you are human') || 
                              bodyText.includes('CLOUDFLARE') ||
                              bodyText.includes('Privacy Terms');
            return !isCloudflare && bodyText.length > 100;
          })();
        ''');

          if (finalCheck == true) {
            _addLog(
                "✅ Successfully reached survey page after $attempt attempts");
            break;
          }
        }

        await Future.delayed(Duration(seconds: 2));
      }
    } catch (e) {
      _addLog("❌ Error in GPLinks flow: $e");
    }
  }

  Future<bool> _solveCloudflareChallenge() async {
    try {
      _addLog("🤖 Attempting Cloudflare auto-solve...");

      Object? result = await _webController.runJavaScriptReturningResult('''
      (function() {
        console.log('🎯 Starting Cloudflare challenge solver...');
        
        // Method 1: Direct checkbox click
        var checkbox = document.querySelector('input[type="checkbox"]');
        if (checkbox && !checkbox.checked) {
          console.log('✅ Found checkbox, clicking...');
          checkbox.click();
          checkbox.checked = true;
          
          // Trigger change event
          var event = new Event('change', { bubbles: true });
          checkbox.dispatchEvent(event);
          
          return 'checkbox-clicked';
        }
        
        // Method 2: Cloudflare Turnstile
        var turnstile = document.querySelector('.cf-turnstile');
        if (turnstile) {
          console.log('✅ Found Turnstile widget...');
          var turnstileCheckbox = turnstile.querySelector('input[type="checkbox"]');
          if (turnstileCheckbox && !turnstileCheckbox.checked) {
            turnstileCheckbox.click();
            return 'turnstile-clicked';
          }
        }
        
        // Method 3: Click verification button
        var buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"]');
        for (var i = 0; i < buttons.length; i++) {
          var btn = buttons[i];
          var text = (btn.textContent || btn.value || '').toLowerCase();
          if (text.includes('verify') || text.includes('continue') || text.includes('proceed')) {
            console.log('✅ Clicking verification button: ' + text);
            btn.click();
            return 'button-clicked';
          }
        }
        
        // Method 4: Try to complete challenge programmatically
        if (window.turnstile) {
          console.log('🎯 Using Turnstile API...');
          try {
            window.turnstile.render();
            return 'turnstile-rendered';
          } catch(e) {
            console.log('Turnstile API failed:', e);
          }
        }
        
        return 'no-elements-found';
      })();
    ''');

      String resultStr = result?.toString() ?? '';
      _addLog("🎯 Cloudflare solve result: $resultStr");

      if (resultStr.contains('clicked') || resultStr.contains('rendered')) {
        return true;
      }

      return false;
    } catch (e) {
      _addLog("❌ Cloudflare solve error: $e");
      return false;
    }
  }

  Future<void> _scrollAndClickContinue() async {
    try {
      await _webController.runJavaScript('''
        window.scrollTo(0, document.body.scrollHeight);
        setTimeout(function() {
          var buttons = document.querySelectorAll('button, a, input[type="submit"]');
          for (var btn of buttons) {
            if (btn.textContent && 
                btn.textContent.toLowerCase().includes('continue')) {
              btn.scrollIntoView();
              btn.click();
              break;
            }
          }
        }, 1000);
      ''');
      _addLog("📜 Scrolled and clicked continue");
    } catch (e) {
      _addLog("❌ Error in scroll and continue: $e");
    }
  }

  Future<void> _clickGetLinkButton() async {
    _addLog("🔗 Looking for Get Link button...");

    setState(() {
      _currentStep =
      "${_currentStep.split(':')[0]}: Clicking Get Link button...";
    });

    try {
      // Enhanced JavaScript with better error handling and timeout
      Object? result = await _webController.runJavaScriptReturningResult('''
      (function() {
        console.log('🔍 Starting enhanced Get Link button detection...');
        
        // Function to find and click get link button with timeout
        function findAndClickGetLinkButton() {
          var foundButton = null;
          var buttonText = '';
          
          // Strategy 1: Look for buttons with exact text matches
          var exactTextPatterns = [
            'get link', 'get the link', 'download', 'claim', 
            'get download link', 'proceed to download',
            'click here to download', 'final step'
          ];
          
          var allButtons = document.querySelectorAll('button, a, input[type="submit"], div[onclick], span[onclick]');
          console.log('🔍 Found', allButtons.length, 'clickable elements');
          
          for (var i = 0; i < allButtons.length; i++) {
            var btn = allButtons[i];
            var btnText = (btn.textContent || btn.innerText || btn.value || '').trim().toLowerCase();
            
            if (btnText && btn.offsetParent !== null) {
              for (var j = 0; j < exactTextPatterns.length; j++) {
                if (btnText.includes(exactTextPatterns[j])) {
                  foundButton = btn;
                  buttonText = btnText;
                  console.log('✅ Found Get Link button:', btnText);
                  break;
                }
              }
              if (foundButton) break;
            }
          }
          
          // If no button found, return false
          if (!foundButton) {
            console.log('❌ No Get Link button found');
            return false;
          }
          
          // Scroll button into view
          foundButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Add visual highlight to show which button we're clicking
          foundButton.style.border = '3px solid red';
          foundButton.style.backgroundColor = '#ffeb3b';
          
          // Click the button
          try {
            console.log('🎯 Clicking Get Link button:', buttonText);
            foundButton.click();
            
            // Also try form submission if button is in a form
            var form = foundButton.closest('form');
            if (form) {
              console.log('📋 Also submitting form');
              form.submit();
            }
            
            console.log('✅ Get Link button clicked successfully');
            return true;
          } catch(e) {
            console.log('❌ Error clicking button:', e);
            return false;
          }
        }
        
        // Execute with timeout
        return findAndClickGetLinkButton();
      })();
    ''');

      bool success = result?.toString() == 'true';

      if (success) {
        _addLog("✅ Get Link button clicked successfully");
      } else {
        _addLog("❌ Could not find or click Get Link button");

        // Fallback: Try to find and click any prominent button
        await _webController.runJavaScript('''
        (function() {
          // Fallback: Click any prominent button
          var buttons = document.querySelectorAll('button, a, input[type="submit"]');
          for (var i = 0; i < buttons.length; i++) {
            var btn = buttons[i];
            if (btn.offsetParent !== null) {
              var style = window.getComputedStyle(btn);
              // Look for prominent buttons (colored, large, etc.)
              if (style.backgroundColor !== 'rgba(0, 0, 0, 0)' || 
                  btn.offsetWidth > 100 || 
                  btn.textContent.includes('Next') ||
                  btn.textContent.includes('Continue')) {
                console.log('🔄 Fallback: Clicking prominent button:', btn.textContent);
                btn.click();
                return true;
              }
            }
          }
          return false;
        })();
      ''');

        _addLog("🔄 Using fallback button click method");
      }

      // Wait for navigation
      await Future.delayed(Duration(seconds: 5));
    } catch (e) {
      _addLog("❌ Error in Get Link button processing: $e");

      // Ultimate fallback: reload the page
      _addLog("🔄 Ultimate fallback: reloading page");
      await _webController.reload();
      await Future.delayed(Duration(seconds: 3));
    }
  }

// Add to your class
  Timer? _operationTimeoutTimer;

  Future<bool> _executeWithTimeout(Future Function() operation,
      {int timeoutSeconds = 30, String operationName = "Operation"}) async {
    try {
      // Set up timeout
      _operationTimeoutTimer = Timer(Duration(seconds: timeoutSeconds), () {
        _addLog("⏰ $operationName timed out after $timeoutSeconds seconds");
        throw TimeoutException("$operationName timed out");
      });

      // Execute the operation
      await operation();

      // Cancel timeout if operation completes
      _operationTimeoutTimer?.cancel();
      return true;
    } on TimeoutException {
      _addLog("❌ $operationName timed out, recovering...");
      return false;
    } catch (e) {
      _addLog("❌ Error in $operationName: $e");
      _operationTimeoutTimer?.cancel();
      return false;
    }
  }

// Modify your key processes to use timeouts
  Future<bool> _safeProcessSurveyWithRetries(
      Map<String, dynamic> linkData) async {
    return await _executeWithTimeout(() async {
      return await _processSurveyWithRetries(linkData);
    }, timeoutSeconds: 45, operationName: "Survey processing");
  }

// Update the safe method to accept the callback parameter
  Future<bool> _safeExtractLinksFromYouTube(
      {Function(List<Map<String, dynamic>>)? onLinksExtracted}) async {
    return await _executeWithTimeout(() async {
      // Pass the callback to the original method
      if (onLinksExtracted != null) {
        return await _extractClickThroughLinksFromYouTube(
            onLinksExtracted: onLinksExtracted);
      } else {
        return await _extractClickThroughLinksFromYouTube();
      }
    }, timeoutSeconds: 30, operationName: "Link extraction");
  }

  Future<void> _safeNavigateToUrl(String url,
      {String purpose = "Navigation"}) async {
    try {
      _addLog(
          "🔗 Navigating to URL for $purpose: ${url.length > 50 ? url.substring(
              0, 50) + '...' : url}");

      await _executeWithTimeout(() async {
        await _webController.loadRequest(Uri.parse(url));

        // Wait for page to start loading
        await Future.delayed(Duration(seconds: 3));

        // Check if navigation was successful
        String currentUrl = await _webController.currentUrl() ?? "";
        if (currentUrl.isEmpty || currentUrl == "about:blank") {
          throw Exception("Navigation failed - page didn't load");
        }
      }, timeoutSeconds: 25, operationName: "$purpose navigation");
    } catch (e) {
      _addLog("❌ Navigation failed: $e");

      // Recovery: Try to reload or navigate to a different page
      _addLog("🔄 Attempting recovery after navigation failure");
      await _webController.loadRequest(Uri.parse('about:blank'));
      await Future.delayed(Duration(seconds: 2));

      // Retry once
      try {
        await _webController.loadRequest(Uri.parse(url));
      } catch (retryError) {
        _addLog("❌ Navigation retry also failed: $retryError");
      }
    }
  }

  Future<void> _monitorPageTransitions() async {
    try {
      _addLog("👁️ Starting page transition monitoring...");

      // Monitor page changes and loading states
      for (int i = 0; i < 10; i++) {
        if (!_isRunning) break;

        try {
          String currentUrl = await _webController.currentUrl() ?? "";

          Object? pageInfo = await _webController.runJavaScriptReturningResult(
              '''
            (function() {
              return JSON.stringify({
                url: window.location.href,
                title: document.title,
                readyState: document.readyState,
                hasContent: document.body.innerText.trim().length > 50,
                isBlank: document.body.innerText.trim().length === 0,
                loadingIndicators: document.querySelectorAll('.loading, .spinner, [class*="load"]').length
              });
            })();
          ''');

          _addLog("🔍 Page check ${i + 1}: ${pageInfo
              .toString()
              .length > 200
              ? pageInfo.toString().substring(0, 200) + '...'
              : pageInfo}");

          // If we detect the final destination (upcloud, drive, etc.), break
          if (currentUrl.contains('u.pcloud') ||
              currentUrl.contains('drive.google') ||
              currentUrl.contains('mediafire') ||
              currentUrl.contains('mega.nz') ||
              currentUrl.contains('download')) {
            _addLog("✅ Final destination detected: $currentUrl");
            break;
          }

          // If page is blank, try to refresh
          String pageInfoStr = pageInfo.toString();
          if (pageInfoStr.contains('"isBlank":true') ||
              pageInfoStr.contains('"hasContent":false')) {
            _addLog("⚠️ Blank page detected, refreshing...");
            await _webController.reload();
          }
        } catch (e) {
          _addLog("⚠️ Page monitoring error: $e");
        }

        await Future.delayed(Duration(seconds: 2));
      }

      _addLog("👁️ Page transition monitoring completed");
    } catch (e) {
      _addLog("❌ Error in page monitoring: $e");
    }
  }

  Future<bool> _verifyFinalDestination() async {
    _addLog("🔍 Starting final destination verification...");

    bool isValidDestination = false;

    await _simulateHumanInteractions();
    await _humanizedDelay(minSeconds: 2, maxSeconds: 4);

    return true;
  }

  Future<void> _processSurveyPage(String url) async {
    // This method is called from _handlePageLoaded
    _addLog("📊 Processing survey page: $url");

    await Future.delayed(Duration(seconds: 2));
    await _closeAdsAndPopups();

    // Try to find and click any survey elements
    try {
      await _webController.runJavaScript('''
        // Look for survey forms or buttons
        var forms = document.querySelectorAll('form');
        var buttons = document.querySelectorAll('button[type="submit"], input[type="submit"]');
        
        // Auto-fill any visible forms
        var inputs = document.querySelectorAll('input[type="text"], input[type="email"]');
        inputs.forEach(function(input, index) {
          if (input.offsetParent !== null) {
            if (input.type === 'email') {
              input.value = 'test' + Math.floor(Math.random() * 1000) + '@gmail.com';
            } else {
              input.value = 'AutomatedResponse' + index;
            }
          }
        });
        
        // Click radio buttons randomly
        var radios = document.querySelectorAll('input[type="radio"]');
        var radioGroups = {};
        radios.forEach(function(radio) {
          if (radio.offsetParent !== null) {
            if (!radioGroups[radio.name]) {
              radioGroups[radio.name] = [];
            }
            radioGroups[radio.name].push(radio);
          }
        });
        
        Object.keys(radioGroups).forEach(function(groupName) {
          var group = radioGroups[groupName];
          var randomIndex = Math.floor(Math.random() * group.length);
          group[randomIndex].checked = true;
        });
        
        // Check checkboxes randomly
        var checkboxes = document.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(function(checkbox) {
          if (checkbox.offsetParent !== null && Math.random() > 0.5) {
            checkbox.checked = true;
          }
        });
      ''');

      _addLog("📝 Auto-filled survey form");
    } catch (e) {
      _addLog("⚠ Error processing survey: $e");
    }
  }

  Future<String> _getCurrentIP() async {
    try {
      final response = await http.get(Uri.parse('https://api.ipify.org'))
          .timeout(Duration(seconds: 10));
      if (response.statusCode == 200) {
        String ip = response.body.trim();
        _addLog("📍 Current IP: $ip");
        return ip;
      }
    } catch (e) {
      _addLog("❌ Failed to get IP: $e");
    }
    return "unknown";
  }

  Future<void> _clearBrowserData() async {
    try {
      await _webController.runJavaScript('''
        // Clear localStorage and sessionStorage
        if (typeof(Storage) !== "undefined") {
          localStorage.clear();
          sessionStorage.clear();
        }
        
        // Clear cookies (limited by same-origin policy)
        document.cookie.split(";").forEach(function(c) { 
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
      ''');
      _addLog("🧹 Cleared browser data");
    } catch (e) {
      _addLog("⚠ Error clearing browser data: $e");
    }
  }

  void _addLog(String message) {
    final timestamp = DateTime.now().toString().substring(11, 19);
    setState(() {
      _logs.add("[$timestamp] $message");
      // The limit removal allows unlimited logs for debugging
    });

  }

  void _showCompletionDialog(List<Map<String, dynamic>> completionSequence) {
    // Calculate accurate completion statistics
    int totalCompletions = 0;
    int maxCompletions = 0;
    int minCompletions = _totalCycles;

    _linkCompletions.forEach((linkId, completions) {
      totalCompletions += completions;
      if (completions > maxCompletions) maxCompletions = completions;
      if (completions < minCompletions) minCompletions = completions;
    });

    final avgCompletions = _linkCompletions.isNotEmpty
        ? totalCompletions / _linkCompletions.length
        : 0;

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('🎉 Automation Complete'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('All $_totalCycles cycles completed successfully!'),
                SizedBox(height: 16),
                Text('Statistics:', style: TextStyle(fontWeight: FontWeight.bold)),
                Text('• Total cycles: $_totalCycles'),
                Text('• Unique IPs used: ${_usedIPs.length}'),
                Text('• Links with completions: ${_linkCompletions.length}'),
                Text('• Total completions: $totalCompletions'),
                Text('• Average completions per link: ${avgCompletions.toStringAsFixed(1)}'),
                Text('• Min completions: $minCompletions'),
                Text('• Max completions: $maxCompletions'),
                SizedBox(height: 16),
                Text('Recent Completions:', style: TextStyle(fontWeight: FontWeight.bold)),
                SizedBox(height: 8),
                // Show only the last 5 completions to avoid overcrowding
                ...completionSequence.reversed.take(5).map((completion) {
                  String time = completion['timestamp'] != null
                      ? "${completion['timestamp'].hour}:${completion['timestamp'].minute.toString().padLeft(2, '0')}"
                      : "Unknown time";
                  return Padding(
                    padding: EdgeInsets.symmetric(vertical: 2),
                    child: Text('${completion['displayName']} - $time'),
                  );
                }).toList(),
                if (completionSequence.length > 5)
                  Text('... and ${completionSequence.length - 5} more'),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: Text('OK'),
            ),
          ],
        );
      },
    );
  }
}