"use client"

import { useState, useEffect, useCallback } from "react"
import { QrCode, Copy, Check, Share2, Download, Users, Target } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Mode = "consultor" | "gestor"

interface QRCardProps {
  title: string
  description: string
  icon: React.ReactNode
  link: string
  accentClass: string
  buttonClass: string
}

function QRCard({ title, description, icon, link, accentClass, buttonClass }: QRCardProps) {
  const [copied, setCopied] = useState(false)
  const [shareError, setShareError] = useState("")

  const encodedLink = encodeURIComponent(link)
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodedLink}&bgcolor=1a1a2e&color=ffffff&margin=10`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
      const textarea = document.createElement("textarea")
      textarea.value = link
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: description, url: link })
      } catch {
        // user cancelled or error
      }
    } else {
      setShareError("Seu navegador nao suporta compartilhamento nativo. Copie o link acima.")
      setTimeout(() => setShareError(""), 4000)
    }
  }

  const handleDownload = () => {
    const downloadUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodedLink}&margin=20`
    const a = document.createElement("a")
    a.href = downloadUrl
    a.download = `qrcode-${title.toLowerCase().replace(/\s+/g, "-")}.png`
    a.target = "_blank"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className={`flex items-center gap-2 text-sm font-medium ${accentClass}`}>
        {icon}
        <span>{title}</span>
      </div>

      <p className="text-slate-400 text-sm text-center max-w-sm">{description}</p>

      <div className="rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 p-3">
        <img
          src={qrSrc}
          alt={`QR Code para ${title}`}
          width={240}
          height={240}
          className="block rounded-lg"
        />
      </div>

      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
          <span className="text-slate-300 text-xs truncate flex-1 font-mono select-all">{link}</span>
          <button
            onClick={handleCopy}
            className="shrink-0 text-slate-400 hover:text-white transition-colors"
            title="Copiar link"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        {shareError && (
          <p className="text-amber-400 text-xs mt-1 px-1">{shareError}</p>
        )}
      </div>

      <div className="flex gap-3 flex-wrap justify-center">
        <Button
          onClick={handleCopy}
          variant="outline"
          size="sm"
          className="border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-200"
        >
          {copied ? <Check className="w-4 h-4 mr-2 text-emerald-400" /> : <Copy className="w-4 h-4 mr-2" />}
          {copied ? "Copiado!" : "Copiar link"}
        </Button>

        <Button
          onClick={handleShare}
          variant="outline"
          size="sm"
          className="border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-200"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Compartilhar
        </Button>

        <Button
          onClick={handleDownload}
          size="sm"
          className={buttonClass}
        >
          <Download className="w-4 h-4 mr-2" />
          Baixar QR
        </Button>
      </div>
    </div>
  )
}

export default function GestorQRCodePage() {
  const [gestorId, setGestorId] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchGestorId = async () => {
      try {
        const res = await fetch("/api/gestor/qrcode")
        if (!res.ok) throw new Error("Falha ao carregar dados do gestor")
        const data = await res.json()
        setGestorId(data.gestorId ?? data.id ?? "")
      } catch (err: any) {
        setError(err.message ?? "Erro desconhecido")
      } finally {
        setLoading(false)
      }
    }

    fetchGestorId()
  }, [])

  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  const consultorLink = `${baseUrl}/captura/consultor/${gestorId}`
  const leadLink = `${baseUrl}/captura/gestor/${gestorId}`

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <QrCode className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">QR Code</h1>
              <p className="text-slate-400 text-sm">Gere e compartilhe QR codes da sua conta</p>
            </div>
          </div>
        </div>

        {loading && (
          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="py-12 text-center">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Carregando dados do gestor...</p>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="bg-slate-900 border-red-800">
            <CardContent className="py-8 text-center">
              <p className="text-red-400 text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && gestorId && (
          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="pt-6">
              <Tabs defaultValue="consultor" className="w-full">
                <TabsList className="w-full bg-slate-800 border border-slate-700 mb-8">
                  <TabsTrigger
                    value="consultor"
                    className="flex-1 data-[state=active]:bg-cyan-600 data-[state=active]:text-white text-slate-400"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Recrutar Consultores
                  </TabsTrigger>
                  <TabsTrigger
                    value="leads"
                    className="flex-1 data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-400"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Captura de Leads
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="consultor" className="mt-0">
                  <QRCard
                    title="Recrutar Consultores"
                    description="Compartilhe este QR code para atrair novos consultores para o seu time. Ao escanear, a pessoa sera direcionada para o formulario de cadastro de consultor vinculado a voce."
                    icon={<Users className="w-4 h-4" />}
                    link={consultorLink}
                    accentClass="text-cyan-400"
                    buttonClass="bg-cyan-600 hover:bg-cyan-700 text-white"
                  />
                </TabsContent>

                <TabsContent value="leads" className="mt-0">
                  <QRCard
                    title="Captura de Leads"
                    description="Compartilhe este QR code para que clientes indiquem veiculos. Ao escanear, o cliente sera direcionado para o formulario de indicacao vinculado a voce."
                    icon={<Target className="w-4 h-4" />}
                    link={leadLink}
                    accentClass="text-emerald-400"
                    buttonClass="bg-emerald-600 hover:bg-emerald-700 text-white"
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {!loading && !error && !gestorId && (
          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="py-8 text-center">
              <p className="text-slate-400 text-sm">Nenhum dado de gestor encontrado.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
