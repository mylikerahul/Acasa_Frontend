// components/TextEditor.jsx
"use client";

import dynamic from 'next/dynamic';
import React, { useState, useEffect } from 'react';

const TextEditor = ({ value, onChange, placeholder = '' }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Dynamically import ReactQuill only on client side
  const ReactQuill = dynamic(
    async () => {
      const { default: RQ } = await import('react-quill');
      const { default: Quill } = await import('quill');
      
      // Register any formats or modules if needed
      return function ForwardRef(props) {
        return <RQ {...props} />;
      };
    },
    {
      ssr: false,
      loading: () => (
        <div className="h-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
          <p className="text-gray-500">Loading editor...</p>
        </div>
      ),
    }
  );

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
      ['clean'],
    ],
  };

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'bullet',
    'link',
  ];

  if (!isMounted) {
    return (
      <div className="h-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
        <p className="text-gray-500">Loading editor...</p>
      </div>
    );
  }

  return (
    <ReactQuill
      theme="snow"
      value={value}
      onChange={onChange}
      modules={modules}
      formats={formats}
      placeholder={placeholder}
      className="text-editor"
      style={{ minHeight: '200px', borderRadius: '8px' }}
    />
  );
};

export default TextEditor;