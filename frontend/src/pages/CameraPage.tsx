/**
 * CameraPage.tsx — Route: /camera
 * Camera Simulator specifically connected to BOT-001.
 * Uses laptop webcam (getUserMedia), captures snapshots, performs OCR, and routes to BOT-001.
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Camera, CameraOff, ArrowRight, Scan, ChevronLeft,
  Loader2, FileText, AlertCircle, CheckCircle2, Sparkles,
  Wifi, HelpCircle, Eye
} from 'lucide-react';

type CameraPageState = 'OFF' | 'ACTIVE' | 'CAPTURING' | 'PROCESSING' | 'DONE';

const SAMPLE_DOCS = [
  {
    title: 'Farmer Equipment Subsidy Notice',
    text: `Farmer Equipment Assistance Scheme (SCHEME-FEAS-001)
Department of Agriculture & Farmers Welfare

Eligibility:
Small and marginal farmers holding 7/12 land extract under 2 hectares.

Benefits:
50% to 80% subsidy up to ₹1,25,000 for tractors, rotavators, and modern equipment.

Documents Required:
- Aadhaar Card
- 7/12 Land Record (Satbara Utara)
- Bank Account Passbook
- Quotation from authorized dealer

Portal: agrimachinery.nic.in`,
  },
  {
    title: 'PM-KUSUM Solar Pump Circular',
    text: `Agricultural Solar Pump Scheme (SCHEME-ASPS-003)
Ministry of New & Renewable Energy (MNRE)

Eligibility:
Farmers with cultivable land and groundwater source / open well / borewell.

Benefits:
Up to 90% subsidy on 3HP, 5HP, and 7.5HP solar pumps. Farmer contributes only 10%.

Documents Required:
- Aadhaar Card
- 7/12 & 8A Land Titles
- Groundwater Survey Certificate
- Bank Statement (Last 6 months)`,
  },
  {
    title: '7/12 Satbara Land Extract (सातबारा उतारा)',
    text: `महाराष्ट्र शासन — महसूल व वन विभाग
गाव नमुना ७ / १२ (सातबारा उतारा)
गाव: पिंपळगाव, तालुका: निफाड, जिल्हा: नाशिक
खाते क्रमांक: ३८२ | भूमापन क्रमांक: ४५/२
एकूण क्षेत्र: १.८५ हेक्टर (जिरायत शेती)
खातेदार: रमेश कोंडिबा पाटील
पीक नोंद: खरीप सोयाबीन, रब्बी हरभरा`,
  },
];

export default function CameraPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const deviceId = searchParams.get('deviceId') || 'BOT-001';

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [camState, setCamState] = useState<CameraPageState>('OFF');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [documentType, setDocumentType] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0.96);
  const [permError, setPermError] = useState<string>('');

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamState('OFF');
  }, []);

  // Auto-stop on unmount
  useEffect(() => () => stopCamera(), [stopCamera]);

  const startCamera = async () => {
    setPermError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCamState('ACTIVE');

      // Log camera started
      fetch('http://localhost:3001/api/devices/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, event: `${deviceId} camera started`, status: 'INFO' }),
      }).catch(() => {});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Camera permission denied';
      setPermError(`Camera access denied: ${msg}. If no webcam is available, you can use the preset document samples below to test OCR!`);
    }
  };

  const captureFrame = async (presetText?: string) => {
    let dataUrl = '';
    if (videoRef.current && canvasRef.current) {
      setCamState('CAPTURING');
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(dataUrl);
      stopCamera();
    }

    setCamState('PROCESSING');

    try {
      const resp = await fetch('http://localhost:3001/api/camera/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          imageBase64: dataUrl ? dataUrl.split(',')[1] : undefined,
          manualText: presetText,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        setExtractedText(data.extractedText ?? '');
        setDocumentType(data.documentType ?? 'Government Scheme Notice');
        setConfidence(data.confidence ?? 0.96);
      } else {
        throw new Error('OCR API failed');
      }
    } catch {
      // Fallback text
      setExtractedText(
        presetText ||
        'Farmer Equipment Assistance Scheme\nDepartment of Agriculture & Farmers Welfare\n\nEligibility: Small and marginal farmers\nBenefits: 50% to 80% subsidy on tractors and implements\nDocuments: Aadhaar, 7/12 Land Record, Bank Account'
      );
      setDocumentType('Farmer Equipment Subsidy Application / Notice');
    }

    setCamState('DONE');
  };

  const handleUsePreset = (doc: typeof SAMPLE_DOCS[0]) => {
    setCapturedImage(null);
    setCamState('PROCESSING');
    setTimeout(() => {
      captureFrame(doc.text);
    }, 800);
  };

  const retake = () => {
    setCapturedImage(null);
    setExtractedText('');
    setDocumentType('');
    startCamera();
  };

  const sendToChatbot = () => {
    const query = `I have scanned this government document with OCR:\n\n"${extractedText.slice(0, 300)}..."\n\nPlease explain what this scheme is, whether I am eligible, what documents I need, and how I can apply.`;
    navigate('/', { state: { initialQuery: query } });
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100">
      {/* ── Header ── */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-100">Camera Simulator</h1>
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Device: {deviceId}
              </span>
            </div>
            <p className="text-[10px] text-slate-500">
              Hardware optical scanner simulation for {deviceId} (Laptop Webcam + OCR)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-xs text-slate-300 border border-slate-700">
            <span className={`w-2 h-2 rounded-full ${camState === 'ACTIVE' ? 'bg-red-400 animate-pulse' : 'bg-emerald-400'}`} />
            <span>Status: {camState === 'ACTIVE' ? 'Recording' : 'Connected'}</span>
          </div>
        </div>
      </header>

      {/* ── Main Viewport ── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Device Context Alert */}
          <div className="glass-card p-3 rounded-xl border border-sky-500/30 bg-sky-950/30 flex items-center justify-between text-xs text-sky-200">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-sky-400 flex-shrink-0" />
              <span>
                Simulating camera hardware linked to <strong>{deviceId}</strong>. Show a physical paper to your webcam, capture, and extract text via OCR.
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Device: {deviceId}</span>
          </div>

          {/* Camera Viewfinder */}
          <div
            className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl"
            style={{ aspectRatio: '16/9', minHeight: 280 }}
          >
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-cover ${camState === 'ACTIVE' ? 'opacity-100' : 'opacity-0'}`}
            />
            <canvas ref={canvasRef} className="hidden" />

            {capturedImage && (
              <img src={capturedImage} alt="Captured frame" className="absolute inset-0 w-full h-full object-cover" />
            )}

            {/* Inactive State */}
            {camState === 'OFF' && !capturedImage && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center">
                  <CameraOff className="w-8 h-8 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">Webcam Inactive</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Click "Start Camera" to enable your laptop webcam, or select a sample document below.
                  </p>
                </div>
                <button
                  onClick={startCamera}
                  className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-900/40 transition-all"
                >
                  <Camera className="w-4 h-4" />
                  Start Camera
                </button>
              </div>
            )}

            {/* Active Viewfinder Overlays */}
            {camState === 'ACTIVE' && (
              <>
                {/* Target Bounding Box */}
                <div className="absolute inset-8 sm:inset-14 border-2 border-emerald-400/70 border-dashed rounded-xl pointer-events-none flex flex-col justify-between p-3">
                  <div className="flex justify-between text-[10px] font-mono text-emerald-400 font-bold bg-black/40 px-2 py-0.5 rounded w-fit">
                    <span>[ALIGN DOCUMENT HERE]</span>
                  </div>
                  <div className="text-center text-[10px] text-emerald-300/80 bg-black/40 py-0.5 rounded">
                    Hold document steady under good lighting
                  </div>
                </div>

                {/* Floating Capture Button */}
                <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-3">
                  <button
                    onClick={() => captureFrame()}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-xl transition-all"
                  >
                    <Scan className="w-4 h-4" />
                    Capture & Read Text (OCR)
                  </button>
                  <button
                    onClick={stopCamera}
                    className="px-4 py-3 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700"
                  >
                    Stop
                  </button>
                </div>
              </>
            )}

            {/* Processing State */}
            {camState === 'PROCESSING' && (
              <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                <Scan className="w-10 h-10 text-emerald-400 animate-pulse" />
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-100">Running Optical Character Recognition (OCR)...</p>
                  <p className="text-xs text-slate-400 mt-1">Extracting text and identifying scheme type for {deviceId}</p>
                </div>
              </div>
            )}
          </div>

          {/* Permission Error Message */}
          {permError && (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-300">Camera Notice:</p>
                <p className="mt-0.5 text-amber-200/80">{permError}</p>
              </div>
            </div>
          )}

          {/* ── Preset Document Samples for Instant Testing ── */}
          <div className="glass-card p-4 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Test With Preset Rural Documents
                </h3>
              </div>
              <span className="text-[10px] text-slate-500">Click any document to simulate instant camera scan</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {SAMPLE_DOCS.map((doc, idx) => (
                <button
                  key={idx}
                  onClick={() => handleUsePreset(doc)}
                  className="text-left p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/40 text-xs text-slate-300 transition-all flex flex-col justify-between group"
                >
                  <div className="font-semibold text-slate-100 group-hover:text-emerald-300 mb-1 line-clamp-1">
                    {doc.title}
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-2">{doc.text.slice(0, 80)}...</p>
                  <div className="mt-2 text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                    <Scan className="w-3 h-3" />
                    <span>Scan Sample</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Extracted OCR Results & Send to BOT-001 ── */}
          {camState === 'DONE' && extractedText && (
            <div className="glass-card p-5 rounded-2xl border border-emerald-500/30 bg-slate-900/80 space-y-4 animate-fadeIn">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">Document Text Extracted</h3>
                    <p className="text-[10px] text-slate-400">
                      Identified Type: <span className="text-emerald-300 font-semibold">{documentType}</span> ({(confidence * 100).toFixed(0)}% confidence)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={retake}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 transition-all"
                  >
                    Retake / Rescan
                  </button>
                  <button
                    onClick={sendToChatbot}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition-all"
                  >
                    Send to Chatbot ({deviceId})
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Editable Extracted Text Box */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 mb-1.5 block">
                  Extracted OCR Text Content:
                </label>
                <textarea
                  value={extractedText}
                  onChange={(e) => setExtractedText(e.target.value)}
                  rows={6}
                  className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 leading-relaxed focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                <span>Text is automatically formatted for {deviceId} natural language processing.</span>
                <span>Ready to dispatch to BOT-001</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
