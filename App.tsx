import React, { useState, useCallback } from 'react';
import { generateScript, renderImage } from './services/geminiService';
import ImageUploader from './components/ImageUploader';
import GeneratedImage from './components/GeneratedImage';
import { SparklesIcon, FilmIcon, PhotoIcon } from './components/icons';
import LoadingSpinner from './components/LoadingSpinner';

type AppMode = 'script' | 'render';
type ScriptDetailInputMode = 'photo' | 'text';

const App: React.FC = () => {
  // Common state
  const [mode, setMode] = useState<AppMode>('script');

  // Main product image for both modes
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);

  // Script Generation State
  const [detailImageFile, setDetailImageFile] = useState<File | null>(null);
  const [detailImagePreview, setDetailImagePreview] = useState<string | null>(null);
  const [scriptDetailInputMode, setScriptDetailInputMode] = useState<ScriptDetailInputMode>('text');
  const [productDetails, setProductDetails] = useState<string>('');
  const [targetAudience, setTargetAudience] = useState<string>('');
  const [otherDetails, setOtherDetails] = useState<string>('');
  const [duration, setDuration] = useState<number>(60);
  const [numberOfScripts, setNumberOfScripts] = useState<number>(1);
  const [generatedScripts, setGeneratedScripts] = useState<string[]>([]);
  const [isScriptLoading, setIsScriptLoading] = useState<boolean>(false);
  const [scriptError, setScriptError] = useState<string | null>(null);

  // Image Rendering State
  const [renderPrompt, setRenderPrompt] = useState<string>('');
  const [renderedImage, setRenderedImage] = useState<string | null>(null);
  const [isRenderLoading, setIsRenderLoading] = useState<boolean>(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  const handleMainImageChange = (file: File) => {
    setMainImageFile(file);
    setGeneratedScripts([]);
    setScriptError(null);
    setRenderedImage(null);
    setRenderError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      setMainImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const resetMainImage = () => {
    setMainImageFile(null);
    setMainImagePreview(null);
  }

  const handleDetailImageChange = (file: File) => {
    setDetailImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setDetailImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const resetDetailImage = () => {
    setDetailImageFile(null);
    setDetailImagePreview(null);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleGenerateScript = useCallback(async () => {
    if (!mainImageFile) {
      setScriptError('Please upload a main product photo.');
      return;
    }
    if (scriptDetailInputMode === 'text' && !productDetails.trim()) {
        setScriptError('Please provide product details in text or upload a detail photo.');
        return;
    }
    if (scriptDetailInputMode === 'photo' && !detailImageFile) {
        setScriptError('Please upload a detail photo or switch to text input.');
        return;
    }


    setIsScriptLoading(true);
    setScriptError(null);
    setGeneratedScripts([]);

    try {
      const mainImageBase64 = await fileToBase64(mainImageFile);
      const mainImagePart = {
        mimeType: mainImageFile.type,
        data: mainImageBase64,
      };

      let detailImagePart;
      if (scriptDetailInputMode === 'photo' && detailImageFile) {
          const detailImageBase64 = await fileToBase64(detailImageFile);
          detailImagePart = {
            mimeType: detailImageFile.type,
            data: detailImageBase64,
          };
      }
      
      const scripts = await generateScript(productDetails, targetAudience, otherDetails, duration, mainImagePart, detailImagePart, numberOfScripts);
      setGeneratedScripts(scripts);
    } catch (err) {
      console.error(err);
      setScriptError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsScriptLoading(false);
    }
  }, [mainImageFile, scriptDetailInputMode, detailImageFile, productDetails, targetAudience, otherDetails, duration, numberOfScripts]);

  const handleRenderImage = useCallback(async () => {
    if (!mainImageFile || !renderPrompt) {
        setRenderError('Please ensure a photo is uploaded and provide a rendering prompt.');
        return;
    }
  
    setIsRenderLoading(true);
    setRenderError(null);
    setRenderedImage(null);
  
    try {
        const base64Data = await fileToBase64(mainImageFile);
        const imagePart = {
            mimeType: mainImageFile.type,
            data: base64Data,
        };
  
        const newImageBase64 = await renderImage(renderPrompt, imagePart);
        setRenderedImage(`data:image/png;base64,${newImageBase64}`);
    } catch (err) {
        console.error(err);
        setRenderError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
        setIsRenderLoading(false);
    }
  }, [mainImageFile, renderPrompt]);

  const canGenerateScript = mainImageFile && ( (scriptDetailInputMode === 'photo' && detailImageFile) || (scriptDetailInputMode === 'text' && productDetails.trim()) );

  const renderScriptGenerator = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Input Section */}
      <div className="card-base">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-3 text-slate-800">1. Upload Product Photo</h2>
            <ImageUploader onImageChange={handleMainImageChange} preview={mainImagePreview} onRemoveImage={resetMainImage} />
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3 text-slate-800">2. Provide Product Details</h2>
            <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                <button onClick={() => setScriptDetailInputMode('text')} className={`flex-1 p-2 rounded-md text-sm transition-colors font-medium ${scriptDetailInputMode === 'text' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:bg-gray-200'}`}>Tulis Detail</button>
                <button onClick={() => setScriptDetailInputMode('photo')} className={`flex-1 p-2 rounded-md text-sm transition-colors font-medium ${scriptDetailInputMode === 'photo' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:bg-gray-200'}`}>Upload Foto Detail</button>
            </div>
            
            <div className="mt-4">
              {scriptDetailInputMode === 'text' ? (
                <textarea id="product-details-text" rows={7} value={productDetails} onChange={(e) => setProductDetails(e.target.value)} className="input-base" placeholder="Jelaskan produk secara detail: fitur, manfaat, bahan, dll." />
              ) : (
                <ImageUploader onImageChange={handleDetailImageChange} preview={detailImagePreview} onRemoveImage={resetDetailImage} />
              )}
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-3 text-slate-800">3. Additional Info</h2>
            <div className="space-y-4">
              <InputGroup label="Target Audiens (opsional)" id="target-audience">
                <input type="text" id="target-audience" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} className="input-base" placeholder="e.g., Mahasiswa, ibu rumah tangga..." />
              </InputGroup>

              <InputGroup label="Detail Lainnya (opsional)" id="other-details">
                <textarea id="other-details" rows={2} value={otherDetails} onChange={(e) => setOtherDetails(e.target.value)} className="input-base" placeholder="e.g., Promo beli 1 gratis 1..." />
              </InputGroup>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputGroup label={`Durasi Script: ${duration} detik`} id="duration">
                    <input type="range" id="duration" min="10" max="180" step="5" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-thumb mt-2" />
                  </InputGroup>
                  <InputGroup label="Jumlah Script" id="num-scripts">
                      <input type="number" id="num-scripts" min="1" max="5" value={numberOfScripts} onChange={(e) => setNumberOfScripts(Number(e.target.value))} className="input-base" />
                  </InputGroup>
              </div>
            </div>
          </div>

          <button onClick={handleGenerateScript} disabled={isScriptLoading || !canGenerateScript} className="w-full btn-primary">
            {isScriptLoading ? (<><LoadingSpinner /> Generating Script...</>) : (<><SparklesIcon className="w-5 h-5" /> Generate Script</>)}
          </button>
        </div>
      </div>

      {/* Output Section */}
      <div className="card-base flex flex-col">
        <h2 className="text-2xl font-semibold mb-4 text-slate-800">Hasil Script</h2>
        <div className="flex-grow bg-gray-50 rounded-lg p-4 border border-gray-200 h-96 overflow-y-auto space-y-6">
          {isScriptLoading && <div className="flex items-center justify-center h-full text-slate-500"><LoadingSpinner /> <span className="ml-2">Generating...</span></div>}
          {scriptError && <div className="text-red-600">Error: {scriptError}</div>}
          
          {generatedScripts.length > 0 && generatedScripts.map((script, index) => (
              <div key={index} className="p-4 bg-white rounded-md border border-gray-200 shadow-sm relative">
                  <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold text-blue-600">Script #{index + 1}</h3>
                      <button 
                          onClick={() => navigator.clipboard.writeText(script)} 
                          className="btn-secondary text-xs px-2 py-1"
                      >
                          Copy
                      </button>
                  </div>
                  <pre className="whitespace-pre-wrap text-slate-700 font-sans text-sm">{script}</pre>
              </div>
          ))}

          {!isScriptLoading && generatedScripts.length === 0 && !scriptError && <div className="text-slate-400 text-center flex items-center justify-center h-full">Your generated script(s) will appear here.</div>}
        </div>
      </div>
    </div>
  );

  const renderImageRenderer = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="card-base">
          <h2 className="text-2xl font-semibold mb-4 text-slate-800">1. Input Foto & Prompt</h2>
          <div className="space-y-6">
            <ImageUploader onImageChange={handleMainImageChange} preview={mainImagePreview} onRemoveImage={resetMainImage}/>
            <InputGroup label="Render Prompt" id="render-prompt">
              <textarea id="render-prompt" rows={4} value={renderPrompt} onChange={(e) => setRenderPrompt(e.target.value)} className="input-base" placeholder="e.g., Add a retro filter, put this product on a beach background..." />
            </InputGroup>
            <button onClick={handleRenderImage} disabled={isRenderLoading || !mainImageFile || !renderPrompt} className="w-full btn-primary">
                {isRenderLoading ? (<><LoadingSpinner /> Rendering Image...</>) : (<><SparklesIcon className="w-5 h-5" /> Render Image</>)}
            </button>
          </div>
        </div>
  
        {/* Output Section */}
        <div className="card-base">
          <h2 className="text-2xl font-semibold mb-4 text-slate-800">2. Hasil Foto</h2>
          <GeneratedImage image={renderedImage} isLoading={isRenderLoading} error={renderError} />
        </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 font-sans">
        <style>{`
            .card-base {
                background-color: #ffffff;
                border-radius: 1rem;
                padding: 2rem;
                border: 1px solid #e2e8f0;
                box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
            }
            .input-base {
                width: 100%;
                background-color: #f8fafc;
                border: 1px solid #cbd5e1;
                border-radius: 0.5rem;
                padding: 0.75rem;
                color: #0f172a;
                transition: border-color 0.2s, box-shadow 0.2s;
            }
            .input-base:focus {
                outline: none;
                border-color: #2563eb;
                box-shadow: 0 0 0 2px rgb(59 130 246 / 0.4);
            }
            .input-base::placeholder {
                color: #94a3b8;
            }
            .btn-primary {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                background-image: linear-gradient(to right, #2563eb, #3b82f6);
                color: white;
                font-weight: bold;
                padding: 0.75rem 1rem;
                border-radius: 0.5rem;
                border: 1px solid #1d4ed8;
                transition: all 0.3s ease-in-out;
                transform-origin: center;
                box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
            }
            .btn-primary:hover:not(:disabled) {
                transform: scale(1.03);
                box-shadow: 0 10px 15px -3px rgb(59 130 246 / 0.2), 0 4px 6px -4px rgb(59 130 246 / 0.2);
            }
            .btn-primary:disabled {
                background: #94a3b8;
                border-color: #64748b;
                cursor: not-allowed;
                transform: scale(1);
            }
            .btn-secondary {
                background-color: #f1f5f9;
                color: #0f172a;
                font-weight: bold;
                padding: 0.75rem 1rem;
                border-radius: 0.5rem;
                border: 1px solid #cbd5e1;
                transition: background-color 0.2s;
            }
            .btn-secondary:hover:not(:disabled) {
                background-color: #e2e8f0;
            }
            .btn-secondary:disabled {
                background-color: #f8fafc;
                color: #94a3b8;
                cursor: not-allowed;
            }
            .range-thumb::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 20px;
              height: 20px;
              background: #2563eb;
              cursor: pointer;
              border-radius: 50%;
              border: 3px solid #ffffff;
              box-shadow: 0 0 0 1px #cbd5e1;
            }

            .range-thumb::-moz-range-thumb {
              width: 20px;
              height: 20px;
              background: #2563eb;
              cursor: pointer;
              border-radius: 50%;
              border: 3px solid #ffffff;
              box-shadow: 0 0 0 1px #cbd5e1;
            }
        `}</style>
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#80aaff] to-[#3b82f6] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'}}></div>
        </div>
        
        <header className="text-center py-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-slate-800">
            Mesin Pembangkit Skrip Video Affiliate
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Ubah foto & detail produk menjadi skrip video siap pakai dengan AI.
          </p>
        </header>

        <main className="container mx-auto max-w-6xl p-4">
            {/* Mode Toggle */}
            <div className="flex justify-center mb-8">
                <div className="bg-gray-100 p-1 rounded-lg flex space-x-1 border border-gray-200">
                    <button onClick={() => setMode('script')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${mode === 'script' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:bg-gray-200'}`}>
                        <FilmIcon className="w-5 h-5 inline-block mr-2"/>
                        Script Generator
                    </button>
                    <button onClick={() => setMode('render')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${mode === 'render' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:bg-gray-200'}`}>
                        <PhotoIcon className="w-5 h-5 inline-block mr-2"/>
                        Image Renderer
                    </button>
                </div>
            </div>

            {mode === 'script' ? renderScriptGenerator() : renderImageRenderer()}
        </main>
      </div>
    </div>
  );
};

const InputGroup: React.FC<{label: string, id: string, children: React.ReactNode}> = ({ label, id, children }) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-2">
        {label}
      </label>
      {children}
    </div>
);


export default App;