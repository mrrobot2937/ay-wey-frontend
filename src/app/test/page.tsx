"use client";
import { useState } from "react";

interface ConfigData {
  twilio_sid_configured?: boolean;
  twilio_token_configured?: boolean;
  twilio_whatsapp_configured?: boolean;
  twilio_whatsapp_number?: string;
  error?: string;
}

interface TestResult {
  success?: boolean;
  message?: string;
  error?: string;
}

export default function TestPage() {
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [testNumber, setTestNumber] = useState("");
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [sandboxNumber, setSandboxNumber] = useState("");

  async function checkConfig() {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/whatsapp/test");
      const data = await res.json();
      setConfig(data);
    } catch {
      setConfig({ error: "No se pudo conectar al backend" });
    } finally {
      setLoading(false);
    }
  }

  async function testWhatsApp() {
    if (!testNumber) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/whatsapp/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: `whatsapp:+57${testNumber.replace(/[^0-9]/g, "")}`
        })
      });
      const data = await res.json();
      setTestResult(data);
    } catch {
      setTestResult({ error: "Error al enviar mensaje de prueba" });
    } finally {
      setLoading(false);
    }
  }

  async function testNegocio() {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/whatsapp/test-negocio", {
        method: "GET"
      });
      const data = await res.json();
      setTestResult(data);
    } catch {
      setTestResult({ error: "Error al enviar mensaje de prueba al negocio" });
    } finally {
      setLoading(false);
    }
  }

  async function addToSandbox() {
    if (!sandboxNumber) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/whatsapp/add-to-sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: sandboxNumber
        })
      });
      const data = await res.json();
      setTestResult(data);
    } catch {
      setTestResult({ error: "Error al agregar número al sandbox" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">Prueba de Configuración WhatsApp</h1>
        
        <div className="bg-zinc-900 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">1. Verificar Configuración</h2>
          <button
            onClick={checkConfig}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Verificando..." : "Verificar Configuración"}
          </button>
          
          {config && (
            <div className="mt-4 p-4 bg-zinc-800 rounded">
              <h3 className="font-bold mb-2">Estado de la configuración:</h3>
              <ul className="space-y-1">
                <li>Account SID: {config.twilio_sid_configured ? "✅ Configurado" : "❌ No configurado"}</li>
                <li>Auth Token: {config.twilio_token_configured ? "✅ Configurado" : "❌ No configurado"}</li>
                <li>WhatsApp Number: {config.twilio_whatsapp_configured ? "✅ Configurado" : "❌ No configurado"}</li>
                <li>Número WhatsApp: {config.twilio_whatsapp_number || "No configurado"}</li>
              </ul>
            </div>
          )}
        </div>

        <div className="bg-zinc-900 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">2. Agregar Número al Sandbox</h2>
          <div className="space-y-4">
            <div>
              <label className="block mb-2">Número de teléfono (con +57):</label>
              <input
                type="text"
                value={sandboxNumber}
                onChange={(e) => setSandboxNumber(e.target.value)}
                placeholder="+573148704059"
                className="w-full px-4 py-2 bg-zinc-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <button
              onClick={addToSandbox}
              disabled={loading || !sandboxNumber}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? "Agregando..." : "Agregar al Sandbox"}
            </button>
          </div>
        </div>

        <div className="bg-zinc-900 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">3. Prueba de Envío</h2>
          <div className="space-y-4">
            <div>
              <label className="block mb-2">Número de teléfono (sin +57):</label>
              <input
                type="text"
                value={testNumber}
                onChange={(e) => setTestNumber(e.target.value)}
                placeholder="3155707763"
                className="w-full px-4 py-2 bg-zinc-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={testWhatsApp}
                disabled={loading || !testNumber}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "Enviando..." : "Enviar Mensaje de Prueba"}
              </button>
              <button
                onClick={testNegocio}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Enviando..." : "Probar Negocio"}
              </button>
            </div>
            
            {testResult && (
              <div className="mt-4 p-4 bg-zinc-800 rounded">
                <h3 className="font-bold mb-2">Resultado:</h3>
                <pre className="text-sm">{JSON.stringify(testResult, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>

        <div className="bg-yellow-900 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">⚠️ Modo Sandbox Detectado</h2>
          <ul className="space-y-2 text-sm">
            <li>• <strong>Estás usando el sandbox de Twilio</strong></li>
            <li>• Solo funciona con números verificados en tu cuenta de Twilio</li>
            <li>• Para agregar tu número:</li>
            <li className="ml-4">1. Ve a <a href="https://console.twilio.com/us1/develop/sms/manage/phone-numbers/whatsapp-sandbox" target="_blank" className="text-blue-300 underline">Twilio WhatsApp Sandbox</a></li>
            <li className="ml-4">2. Agrega tu número: +573148704059</li>
            <li className="ml-4">3. Envía el código de verificación que recibas</li>
            <li className="ml-4">4. Luego prueba nuevamente</li>
            <li>• <strong>Para producción:</strong> Necesitas un número de WhatsApp Business aprobado</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 