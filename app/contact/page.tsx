"use client"

import type React from "react"

import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Mail, MessageSquare, Phone, MapPin, Facebook, Instagram, Youtube, PanelsTopLeft } from "lucide-react"
import { useState } from "react"

export default function ContactPage() {
   const [formData, setFormData] = useState({
     name: "",
     email: "",
     subject: "",
     message: "",
   })
   const [copiedEmail, setCopiedEmail] = useState(false)
   const [copieddevEmail, setdevCopiedEmail] = useState(false)
   const [copiedPhone, setCopiedPhone] = useState(false)
   const [copieddevPhone, setdevCopiedPhone] = useState(false)
   const [copiedFacebook, setCopiedFacebook] = useState(false)
   const [copiedInstagram, setCopiedInstagram] = useState(false)
   const [copiedYoutube, setCopiedYoutube] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        alert("Message sent successfully!")
        setFormData({ name: "", email: "", subject: "", message: "" })
      } else {
        throw new Error(result.error || "Failed to send message.")
      }
    } catch (err) {
      console.error("Failed to save message", err)
      alert("Failed to send message. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }
  const copyDEVEmailToClipboard = async () => {
    try {
      await navigator.clipboard.writeText("MTAStudios@gmail.com")
      setdevCopiedEmail(true)
      setTimeout(() => setdevCopiedEmail(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = "MTAStudios@gmail.com"
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        document.execCommand('copy')
        setdevCopiedEmail(true)
        setTimeout(() => setdevCopiedEmail(false), 2000)
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr)
      }
      document.body.removeChild(textArea)
    }
  }
  const copyEmailToClipboard = async () => {
    try {
      await navigator.clipboard.writeText("blackbullzweb@gmail.com")
      setCopiedEmail(true)
      setTimeout(() => setCopiedEmail(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = "blackbullzweb@gmail.com"
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        document.execCommand('copy')
        setCopiedEmail(true)
        setTimeout(() => setCopiedEmail(false), 2000)
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr)
      }
      document.body.removeChild(textArea)
    }
  }
  const copyPhoneToClipboard = async () => {
    try {
      await navigator.clipboard.writeText("+92 349 4081854")
      setCopiedPhone(true)
      setTimeout(() => setCopiedPhone(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = "+92 349 4081854"
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        document.execCommand('copy')
        setCopiedPhone(true)
        setTimeout(() => setCopiedPhone(false), 2000)
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr)
      }
      document.body.removeChild(textArea)
    }
  }
  const copydevPhoneToClipboard = async () => {
    try {
      await navigator.clipboard.writeText("+92 3201446656")
      setdevCopiedPhone(true)
      setTimeout(() => setdevCopiedPhone(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = "+92 3201446656"
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        document.execCommand('copy')
        setdevCopiedPhone(true)
        setTimeout(() => setCopiedPhone(false), 2000)
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr)
      }
      document.body.removeChild(textArea)
    }
  }
    const copyfacebookToClipboard = async () => {
    try {
      await navigator.clipboard.writeText("@miantaha.aslam.7")
      setCopiedFacebook(true)
      setTimeout(() => setCopiedFacebook(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = "@miantaha.aslam.7"
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        document.execCommand('copy')
        setCopiedFacebook(true)
        setTimeout(() => setCopiedFacebook(false), 2000)
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr)
      }
      document.body.removeChild(textArea)
    }
  }

  const copyInstagramToClipboard = async () => {
    try {
      await navigator.clipboard.writeText("@tahachoudhary16")
      setCopiedInstagram(true)
      setTimeout(() => setCopiedInstagram(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = "@tahachoudhary16"
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        document.execCommand('copy')
        setCopiedInstagram(true)
        setTimeout(() => setCopiedInstagram(false), 2000)
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr)
      }
      document.body.removeChild(textArea)
    }
  }

  const copyYoutubeToClipboard = async () => {
    try {
      await navigator.clipboard.writeText("@blackbullz-games")
      setCopiedYoutube(true)
      setTimeout(() => setCopiedYoutube(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = "@blackbullz-games"
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        document.execCommand('copy')
        setCopiedYoutube(true)
        setTimeout(() => setCopiedYoutube(false), 2000)
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr)
      }
      document.body.removeChild(textArea)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 relative" style={{
        backgroundImage: 'url("https://img.freepik.com/premium-photo/horror-game-background_670382-279176.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
      <Header />
      <div className="container mx-auto px-4 py-4 md:py-6">
        <div className="flex justify-center">
          <main className="w-full max-w-6xl">
            <div className="space-y-4 md:space-y-6">
              <div className="text-center px-2">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Contact Us</h1>
                <p className="text-gray-400 text-sm md:text-base">Get in touch with our team</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Contact Form */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Send us a message
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Input
                          name="name"
                          placeholder="Your Name"
                          value={formData.name}
                          onChange={handleChange}
                          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 text-sm md:text-base h-10 md:h-11"
                          required
                        />
                      </div>
                      <div>
                        <Input
                          name="email"
                          type="email"
                          placeholder="Your Email"
                          value={formData.email}
                          onChange={handleChange}
                          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 text-sm md:text-base h-10 md:h-11"
                          required
                        />
                      </div>
                      <div>
                        <Input
                          name="subject"
                          placeholder="Subject"
                          value={formData.subject}
                          onChange={handleChange}
                          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 text-sm md:text-base h-10 md:h-11"
                          required
                        />
                      </div>
                      <div>
                        <Textarea
                          name="message"
                          placeholder="Your Message"
                          value={formData.message}
                          onChange={handleChange}
                          rows={4}
                          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 text-sm md:text-base min-h-[100px] md:min-h-[120px]"
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 h-10 md:h-11 text-sm md:text-base font-medium" disabled={isSubmitting}>
                        {isSubmitting ? "Sending..." : "Send Message"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Contact Information */}
                <div className="space-y-4">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Contact Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg hover:bg-gray-700 transition-colors">
                        <div className="flex items-center gap-3 flex-1">
                          <Mail className="h-6 w-6 md:h-7 md:w-7 text-red-400 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-white font-medium text-sm md:text-base">Email</p>
                            <p className="text-gray-400 text-xs md:text-sm break-all">blackbullzweb@gmail.com</p>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            onClick={() => window.open("https://mail.google.com/mail/?view=cm&fs=1&to=blackbullzweb@gmail.com&su=Problem%20With%20BlackBullz&body=I%20got%20problem%20with%20BlackBullz", "_blank")}
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white px-2 md:px-3"
                          >
                            <Mail className="h-3 w-3 md:h-4 md:w-4" />
                          </Button>
                          <Button
                            onClick={copyEmailToClipboard}
                            size="sm"
                            variant="outline"
                            className="bg-gray-600 border-gray-500 text-white hover:bg-gray-500 px-2 md:px-3 text-xs md:text-sm"
                          >
                            Copy {copiedEmail && <span className="text-green-400 ml-1">✓</span>}
                          </Button>
                        </div>
                      </div>
                      {/* <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700 transition-colors">
                        <Facebook className="h-7 w-7 text-blue-400" />
                        <div className="flex-1">
                          <p className="text-white font-medium">Facebook</p>
                          <p className="text-gray-400 text-sm">@miantaha.aslam.7</p>
                        </div>
                        <Button
                          onClick={() => window.open("https://facebook.com/miantaha.aslam.7", "_blank")}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Facebook className="h-4 w-4" />
                        </Button>
                            <Button
                            onClick={copyfacebookToClipboard}
                            size="sm"
                            variant="outline"
                            className="bg-gray-600 border-gray-500 text-white hover:bg-gray-500"
                          >
                            Copy {copiedFacebook && <span className="text-green-400 ml-1">✓</span>}
                          </Button>
                      </div> */}
                      {/* <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700 transition-colors">
                        <Instagram className="h-7 w-7 text-pink-400" />
                        <div className="flex-1">
                          <p className="text-white font-medium">Instagram</p>
                          <p className="text-gray-400 text-sm">@tahachoudhary16</p>
                        </div>
                        <Button
                          onClick={() => window.open("https://www.instagram.com/tahachoudhary16?igsh=YTh4b3N2amZwNm5z", "_blank")}
                          size="sm"
                          className="bg-pink-600 hover:bg-pink-700 text-white"
                        >
                          <Instagram className="h-4 w-4" />
                        </Button>
                            <Button
                            onClick={copyInstagramToClipboard}
                            size="sm"
                            variant="outline"
                            className="bg-gray-600 border-gray-500 text-white hover:bg-gray-500"
                          >
                            Copy {copiedInstagram && <span className="text-green-400 ml-1">✓</span>}
                          </Button>
                      </div> */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg hover:bg-gray-700 transition-colors">
                        <div className="flex items-center gap-3 flex-1">
                          <Youtube className="h-6 w-6 md:h-7 md:w-7 text-red-400 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-white font-medium text-sm md:text-base">YouTube</p>
                            <p className="text-gray-400 text-xs md:text-sm break-all">@blackbullz-games</p>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            onClick={() => window.open("https://www.youtube.com/@unaffordablz?sub_confirmation=1", "_blank")}
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white px-2 md:px-3"
                          >
                            <Youtube className="h-3 w-3 md:h-4 md:w-4" />
                          </Button>
                          <Button
                            onClick={copyYoutubeToClipboard}
                            size="sm"
                            variant="outline"
                            className="bg-gray-600 border-gray-500 text-white hover:bg-gray-500 px-2 md:px-3 text-xs md:text-sm"
                          >
                            Copy {copiedYoutube && <span className="text-green-400 ml-1">✓</span>}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Development Interest Section */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Website Development & Business Inquiries
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center px-2">
                    <h3 className="text-lg md:text-xl font-semibold text-white mb-3">
                      Interested in Similar Website Development?
                    </h3>
                    <p className="text-gray-300 mb-4 md:mb-6 leading-relaxed text-sm md:text-base px-2">
                      If you're interested in this website or want to develop a similar gaming/software download platform, business partnerships, custom development, or any related inquiries, feel free to contact us. We're always open to new opportunities and collaborations.
                    </p>
                  </div>

                  {/* Development Contact */}
                  <div className="bg-gray-700 p-3 md:p-4 rounded-lg border border-gray-600">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                      <div className="flex items-center gap-3 flex-1">
                        <MessageSquare className="h-6 w-6 md:h-7 md:w-7 text-blue-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-white font-medium text-sm md:text-base">MTA Studios Development & Business Inquiries</p>
                          <p className="text-gray-400 text-xs md:text-sm">Contact for website development, partnerships</p>
                        </div>
                      </div>
                    </div>
                      {/* <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700 transition-colors">
                        <Phone className="h-7 w-7 text-green-400" />
                        <div className="flex-1">
                          <p className="text-white font-medium">WhatsApp</p>
                          <p className="text-gray-400 text-sm">+923201446656</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => window.open("https://wa.me/923201446656?text=Hello%2C%20I%E2%80%99m%20interested%20in%20your%20website%20development%20services", "_blank")}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={copydevPhoneToClipboard}
                            size="sm"
                            variant="outline"
                            className="bg-gray-600 border-gray-500 text-white hover:bg-gray-500"
                          >
                            Copy {copieddevPhone && <span className="text-green-400 ml-1">✓</span>}
                          </Button>
                        </div>
                      </div> */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg hover:bg-gray-700 transition-colors">
                        <div className="flex items-center gap-3 flex-1">
                          <Mail className="h-6 w-6 md:h-7 md:w-7 text-red-400 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-white font-medium text-sm md:text-base">Email</p>
                            <p className="text-gray-400 text-xs md:text-sm break-all">MTAStudioscompany@gmail.com</p>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            onClick={() => window.open("https://mail.google.com/mail/?view=cm&fs=1&to=MTStudios@gmail.com&su=About%20Website%20Development&body=I%20got%20Interested%20in%20your%20Website%20Development%20Services.%20Please%20let%20me%20know%20more", "_blank")}
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white px-2 md:px-3"
                          >
                            <Mail className="h-3 w-3 md:h-4 md:w-4" />
                          </Button>
                          <Button
                            onClick={copyDEVEmailToClipboard}
                            size="sm"
                            variant="outline"
                            className="bg-gray-600 border-gray-500 text-white hover:bg-gray-500 px-2 md:px-3 text-xs md:text-sm"
                          >
                            Copy {copieddevEmail && <span className="text-green-400 ml-1">✓</span>}
                          </Button>
                        </div>
                      </div>
                    
                  </div>

                  {/* Note */}
                  <div className="bg-blue-900/20 border border-blue-600 p-3 md:p-4 rounded-lg">
                    <p className="text-blue-300 text-xs md:text-sm leading-relaxed">
                      <strong>Note:</strong> For general game/software download questions, use the contact form above or the main contact information. This section is specifically for website development and business inquiries.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Footer Credit */}
            <div className="text-center md:text-right text-gray-500 text-xs md:text-sm mt-6 md:mt-8">
              <p>Made by <span className="text-gray-400 font-bold">MTA Studios</span></p>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

