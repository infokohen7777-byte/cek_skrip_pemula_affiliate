import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import { ImageIcon } from './icons';

interface GeneratedImageProps {
  image: string | null;
  isLoading: boolean;
  error: string | null;
}

const GeneratedImage: React.FC<GeneratedImageProps> = ({ image, isLoading, error }) => {
  return (
    <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center w-full h-full border border-gray-200">
      {isLoading ? (
        <div className="flex flex-col items-center text-slate-500">
          <LoadingSpinner />
          <p className="mt-2">Generating your image...</p>
        </div>
      ) : error ? (
        <div className="text-center text-red-600 p-4">
          <p>Generation failed.</p>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
      ) : image ? (
        <img src={image} alt="Generated" className="object-contain max-w-full max-h-full rounded-lg" />
      ) : (
        <div className="text-center text-slate-400">
          <ImageIcon className="mx-auto h-16 w-16" />
          <p className="mt-2">Your generated image will appear here</p>
        </div>
      )}
    </div>
  );
};

export default GeneratedImage;