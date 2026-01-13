import React from 'react';
import { FiX } from 'react-icons/fi';

const ImagePreview = ({ image, onRemove, isMain = false }) => {
  const isFile = image instanceof File;
  const imageUrl = isFile ? URL.createObjectURL(image) : `${process.env.NEXT_PUBLIC_API_URL}/uploads/properties/${image}`;

  return (
    <div className="relative group">
      <div className="aspect-video rounded-lg overflow-hidden border border-gray-200">
        <img
          src={imageUrl}
          alt="Preview"
          className="w-full h-full object-cover"
          onLoad={() => {
            if (isFile) {
              URL.revokeObjectURL(imageUrl);
            }
          }}
        />
      </div>
      
      {isMain && (
        <div className="absolute top-2 left-2">
          <span className="px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded">
            Main
          </span>
        </div>
      )}
      
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
      >
        <FiX className="h-3 w-3" />
      </button>
    </div>
  );
};

export default ImagePreview;