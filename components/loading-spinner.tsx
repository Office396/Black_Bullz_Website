"use client"

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="relative">
        <div className="w-20 h-20 flex items-center justify-center">
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center border-2 border-red-600 relative animate-bounce">
            <div className="w-10 h-10 bg-gray-900 rounded-full relative">
              {/* Bull face features */}
              <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-white rounded-full"></div>
              <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-white rounded-full"></div>
              <div className="absolute top-3 left-2.5 w-1 h-1 bg-red-500 rounded-full"></div>
              <div className="absolute top-3 right-2.5 w-1 h-1 bg-red-500 rounded-full"></div>
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-3 h-1.5 bg-gray-600 rounded"></div>
              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-gray-400 rounded-full"></div>
            </div>
            {/* Animated red horns */}
            <div className="absolute -top-2 left-3 w-2 h-4 bg-red-600 rounded-t-full transform rotate-12 animate-pulse"></div>
            <div className="absolute -top-2 right-3 w-2 h-4 bg-red-600 rounded-t-full transform -rotate-12 animate-pulse"></div>
            {/* Running effect - moving legs */}
            <div className="absolute -bottom-1 left-2 w-1 h-2 bg-black rounded animate-ping"></div>
            <div
              className="absolute -bottom-1 right-2 w-1 h-2 bg-black rounded animate-ping"
              style={{ animationDelay: "0.3s" }}
            ></div>
          </div>
        </div>
        <div className="mt-2 text-center">
          <p className="text-red-400 text-sm font-medium animate-pulse">Loading BlackBullz...</p>
          <div className="flex justify-center mt-1">
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-red-600 rounded-full animate-bounce"></div>
              <div className="w-1 h-1 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
              <div className="w-1 h-1 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
