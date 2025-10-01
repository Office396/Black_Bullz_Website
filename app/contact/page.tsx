"use client"

import type React from "react"

import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Mail, MessageSquare, Phone, MapPin, Facebook, Instagram, Youtube } from "lucide-react"
import { useState } from "react"

export default function ContactPage() {
   const [formData, setFormData] = useState({
     name: "",
     email: "",
     subject: "",
     message: "",
   })
   const [copiedEmail, setCopiedEmail] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
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

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          <main className="flex-1">
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-white mb-2">Contact Us</h1>
                <p className="text-gray-400">Get in touch with our team</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
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
                          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          required
                        />
                      </div>
                      <div>
                        <Input
                          name="subject"
                          placeholder="Subject"
                          value={formData.subject}
                          onChange={handleChange}
                          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          required
                        />
                      </div>
                      <div>
                        <Textarea
                          name="message"
                          placeholder="Your Message"
                          value={formData.message}
                          onChange={handleChange}
                          rows={5}
                          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
                        Send Message
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
                      <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700 transition-colors">
                        <Mail className="h-7 w-7 text-red-400" />
                        <div>
                          <p
                            onClick={() => window.open("https://mail.google.com/mail/?view=cm&fs=1&to=blackbullzweb@gmail.com&su=Problem%20With%20BlackBullz&body=I%20got%20problem%20with%20BlackBullz", "_blank")}
                            className="text-white font-medium hover:text-red-600 cursor-pointer"
                          >
                            Email
                          </p>
                          <p
                            onClick={copyEmailToClipboard}
                            className="text-gray-400 text-sm hover:text-red-600 cursor-pointer"
                          >
                            blackbullzweb@gmail.com {copiedEmail && <span className="text-green-400 ml-2">✓ Copied!</span>}
                          </p>
                        </div>
                      </div>
                      <div
                        onClick={() => window.open("https://wa.me/923494081854?text=Hello%2C%20I%E2%80%99m%20interested%20in%20your%20services%21", "_blank")}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
                      >
                        <Phone className="h-7 w-7 text-green-400" />
                        <div>
                          <p className="text-white font-medium hover:text-red-600">WhatsApp</p>
                          <p className="text-gray-400 text-sm">Start a chat</p>
                        </div>
                      </div>
                      <div
                        onClick={() => window.open("https://facebook.com/miantaha.aslam.7", "_blank")}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
                      >
                        <Facebook className="h-7 w-7 text-blue-400" />
                        <div>
                          <p className="text-white font-medium hover:text-red-600">Facebook</p>
                          <p className="text-gray-400 text-sm">Connect with us</p>
                        </div>
                      </div>
                      <div
                        onClick={() => window.open("https://www.instagram.com/tahachoudhary16?igsh=YTh4b3N2amZwNm5z", "_blank")}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
                      >
                        <Instagram className="h-7 w-7 text-pink-400" />
                        <div>
                          <p className="text-white font-medium hover:text-red-600">Instagram</p>
                          <p className="text-gray-400 text-sm">Connect with us</p>
                        </div>
                      </div>
                      <div
                        onClick={() => window.open("https://www.youtube.com/@unaffordablz?sub_confirmation=1", "_blank")}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
                      >
                        <Youtube className="h-7 w-7 text-red-400" />
                        <div>
                          <p className="text-white font-medium hover:text-red-600">YouTube</p>
                          <p className="text-gray-400 text-sm">Connect with us</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </main>
          <aside className="w-80 hidden lg:block">
            <Sidebar />
          </aside>
        </div>
      </div>
    </div>
  )
}

