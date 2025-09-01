"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Mail, MessageCircle, Send, Clock, Facebook, Twitter, Instagram, Youtube } from "lucide-react"

export function ContactContent() {
  const contactMethods = [
    {
      icon: <MessageCircle className="h-6 w-6" />,
      title: "WhatsApp",
      description: "Quick support and instant responses",
      value: "+1 (555) 123-4567",
      action: "Chat Now",
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      icon: <Mail className="h-6 w-6" />,
      title: "Email",
      description: "For detailed inquiries and support",
      value: "support@blackbulls.com",
      action: "Send Email",
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
  ]

  const socialMedia = [
    {
      icon: <Facebook className="h-5 w-5" />,
      name: "Facebook",
      handle: "@BlackBullsGaming",
      followers: "125K",
      color: "text-blue-600",
    },
    {
      icon: <Twitter className="h-5 w-5" />,
      name: "Twitter",
      handle: "@BlackBullsGame",
      followers: "89K",
      color: "text-sky-500",
    },
    {
      icon: <Instagram className="h-5 w-5" />,
      name: "Instagram",
      handle: "@blackbullsgaming",
      followers: "156K",
      color: "text-pink-500",
    },
    {
      icon: <Youtube className="h-5 w-5" />,
      name: "YouTube",
      handle: "Black Bulls Gaming",
      followers: "234K",
      color: "text-red-500",
    },
  ]

  return (
    <main className="flex-1 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-balance mb-4">
            Get in <span className="text-primary">Touch</span>
          </h1>
          <p className="text-lg text-muted-foreground text-pretty">
            Have questions, suggestions, or need support? We're here to help! Reach out through any of our channels.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Methods */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Contact Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {contactMethods.map((method, index) => (
                <Card key={index} className={`${method.bgColor} border-0`}>
                  <CardContent className="p-6 text-center">
                    <div className={`${method.color} mb-3 flex justify-center`}>{method.icon}</div>
                    <h3 className="font-semibold mb-2">{method.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{method.description}</p>
                    <p className="font-medium text-sm mb-4">{method.value}</p>
                    <Button size="sm" className="w-full">
                      {method.action}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Send us a Message
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Name</label>
                    <Input placeholder="Your full name" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Email</label>
                    <Input type="email" placeholder="your.email@example.com" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Subject</label>
                  <Input placeholder="What's this about?" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Message</label>
                  <Textarea placeholder="Tell us more about your inquiry..." className="min-h-32" />
                </div>
                <Button className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Business Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Business Hours
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Monday - Friday</span>
                  <span className="text-sm font-medium">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Saturday</span>
                  <span className="text-sm font-medium">10:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Sunday</span>
                  <span className="text-sm font-medium">Closed</span>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    All times are in EST. Emergency support available 24/7.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Social Media */}
            <Card>
              <CardHeader>
                <CardTitle>Follow Us</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {socialMedia.map((social, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={social.color}>{social.icon}</div>
                      <div>
                        <p className="font-medium text-sm">{social.name}</p>
                        <p className="text-xs text-muted-foreground">{social.handle}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {social.followers}
                    </Badge>
                  </div>
                ))}
                <Button variant="outline" className="w-full mt-4 bg-transparent">
                  Follow All Channels
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
