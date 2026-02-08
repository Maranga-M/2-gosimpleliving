import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Sparkles, Loader2, CheckCircle, UploadCloud, Trash2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateWebsiteImage } from '../services/geminiService';
import { dbService } from '../services/database';
import { Button } from './Button';

interface MediaManagerProps {
  currentImageUrl: string;
  onImageSelect: (url: string) => void;
}

export const MediaManager: React.FC<MediaManagerProps> = ({ currentImageUrl, onImageSelect }) => {
  const [activeTab, setActiveTab] = useState<'library' | 'upload' | 'ai'>('library');

  // Library State
  const [images, setImages] = useState<{ name: string; url: string }[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);

  // AI State
  const [prompt, setPrompt] = useState('A bright, modern home office setup');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // Upload State
  const [isUploading, setIsUploading] = useState(false);

  // Deletion Confirmation State
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'library') {
      loadLibrary();
    }
  }, [activeTab]);

  const loadLibrary = async () => {
    setIsLoadingLibrary(true);
    try {
      const list = await dbService.listImages();
      setImages(list);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingLibrary(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, fileName: string) => {
    e.stopPropagation();

    if (confirmingDelete !== fileName) {
      setConfirmingDelete(fileName);
      // Auto-reset after 3 seconds
      setTimeout(() => setConfirmingDelete(prev => prev === fileName ? null : prev), 3000);
      return;
    }

    try {
      await dbService.deleteImage(fileName);
      setImages(prev => prev.filter(img => img.name !== fileName));
      setConfirmingDelete(null);
    } catch (error) {
      toast.error('Failed to delete image');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Create a promise to handle the file reading
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            resolve(reader.result as string);
          } else {
            reject(new Error('Failed to read file'));
          }
        };
        reader.onerror = () => reject(new Error('File reading failed'));
        reader.readAsDataURL(file);
      });

      const fileName = `upload-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
      const url = await dbService.uploadImage(base64, fileName);

      if (url) {
        onImageSelect(url);
        setActiveTab('library');
      } else {
        throw new Error('Upload returned no URL');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(`Upload failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
      // Reset input value to allow selecting same file again
      e.target.value = '';
    }
  };

  const handleAiGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const url = await generateWebsiteImage(prompt);
      setGeneratedImage(url);
    } catch (error) {
      toast.error('Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAiImage = async () => {
    if (!generatedImage) return;
    setIsUploading(true);
    try {
      const fileName = `ai-${Date.now()}.png`;
      const publicUrl = await dbService.uploadImage(generatedImage, fileName);
      if (publicUrl) {
        onImageSelect(publicUrl);
        setActiveTab('library');
        setGeneratedImage(null);
      }
    } catch (error) {
      toast.error('Failed to save AI image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAiDownload = async () => {
    if (!generatedImage) return;
    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generated-hero-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download image');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('library')}
          className={`flex-1 py-3 text-sm font-medium ${activeTab === 'library' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-b-2 border-amber-500' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
        >
          Library
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-3 text-sm font-medium ${activeTab === 'upload' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-b-2 border-amber-500' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
        >
          Upload
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-3 text-sm font-medium ${activeTab === 'ai' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-b-2 border-amber-500' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
        >
          AI Generator
        </button>
      </div>

      <div className="p-4">
        {/* Library Tab */}
        {activeTab === 'library' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Select an image</h4>
              <button onClick={loadLibrary} className="text-slate-400 hover:text-slate-600">
                <RefreshCw size={14} className={isLoadingLibrary ? 'animate-spin' : ''} />
              </button>
            </div>

            {isLoadingLibrary ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-amber-500" />
              </div>
            ) : images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-2">
                {images.map((img) => (
                  <div
                    key={img.name}
                    onClick={() => onImageSelect(img.url)}
                    className={`group relative aspect-video rounded-lg overflow-hidden cursor-pointer border-2 ${currentImageUrl === img.url ? 'border-amber-500' : 'border-transparent hover:border-slate-300'}`}
                  >
                    <img src={img.url} alt={img.name} className="w-full h-full object-cover" />

                    {/* Selection Indicator */}
                    {currentImageUrl === img.url && (
                      <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full p-0.5">
                        <CheckCircle size={14} />
                      </div>
                    )}

                    {/* Delete Button */}
                    <button
                      onClick={(e) => handleDelete(e, img.name)}
                      className={`absolute bottom-1 right-1 p-1.5 rounded transition-all duration-200 flex items-center gap-1.5 ${confirmingDelete === img.name
                          ? 'bg-red-700 text-white w-auto px-2 opacity-100'
                          : 'bg-red-600 text-white opacity-0 group-hover:opacity-100 hover:bg-red-700'
                        }`}
                      title={confirmingDelete === img.name ? "Confirm delete?" : "Delete image"}
                    >
                      <Trash2 size={12} />
                      {confirmingDelete === img.name && <span className="text-[10px] font-bold">Confirm?</span>}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                <ImageIcon size={24} className="mx-auto text-slate-400 mb-2" />
                <p className="text-sm text-slate-500">No images found. Upload or generate one!</p>
              </div>
            )}
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="flex flex-col items-center justify-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700">
            {isUploading ? (
              <div className="text-center">
                <Loader2 size={32} className="animate-spin text-amber-500 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Uploading...</p>
              </div>
            ) : (
              <>
                <UploadCloud size={48} className="text-slate-400 mb-3" />
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-4">Click to upload an image file</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <span className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg cursor-pointer text-sm font-medium transition-colors">
                    Upload Image
                  </span>
                </label>
                <p className="text-xs text-slate-400 mt-2">JPG, PNG, WebP up to 5MB</p>
              </>
            )}
          </div>
        )}

        {/* AI Tab */}
        {activeTab === 'ai' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Describe the image</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-amber-500 min-h-[80px]"
                placeholder="A modern living room with bright sunlight..."
              />
            </div>

            {generatedImage ? (
              <div className="space-y-3">
                <img src={generatedImage} alt="Generated" className="w-full h-48 object-cover rounded-lg border border-slate-200" />
                <div className="flex gap-2">
                  <Button onClick={handleSaveAiImage} className="flex-1 gap-2" disabled={isUploading}>
                    {isUploading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                    Save & Use
                  </Button>
                  <Button onClick={handleAiDownload} variant="secondary" className="flex-1 gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700">
                    <UploadCloud size={16} className="rotate-180" />
                    Download
                  </Button>
                  <Button onClick={() => setGeneratedImage(null)} variant="secondary" className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-200">
                    <Trash2 size={16} className="mr-2" />
                    Discard
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={handleAiGenerate} disabled={isGenerating} className="w-full gap-2">
                {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                Generate Image
              </Button>
            )}
          </div>
        )}
      </div>
      <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800">
        <p className="text-[10px] text-slate-500 flex items-center gap-1.5 font-medium">
          <Sparkles size={10} className="text-amber-500" />
          Note: Selecting an image only updates the draft. You must click "Save" or "Publish" in the main editor to go live.
        </p>
      </div>
    </div>
  );
};