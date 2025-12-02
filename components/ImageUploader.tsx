import React, { useRef } from 'react';
import { UploadIcon } from './icons';

interface ImageUploaderProps {
  onImageChange: (file: File) => void;
  preview: string | null;
  onRemoveImage: () => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageChange, preview, onRemoveImage }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageChange(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemoveImage();
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }

  return (
    <div>
      <div
        onClick={handleClick}
        className="mt-1 flex justify-center p-2 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-blue-500 transition-colors bg-gray-50 min-h-[16rem] items-center"
      >
        <div className="text-center w-full relative">
          {preview ? (
            <>
              <img src={preview} alt="Preview" className="mx-auto max-h-60 rounded-md" />
              <button onClick={handleRemove} className="absolute -top-3 -right-3 bg-white border border-gray-300 rounded-full p-1 text-slate-600 hover:bg-red-500 hover:text-white transition-colors" aria-label="Remove image">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            </>
          ) : (
            <div className="space-y-1 text-center">
                <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600 justify-center">
                    <p className="pl-1">Click to upload or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
            </div>
          )}
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/gif"
      />
    </div>
  );
};

export default ImageUploader;