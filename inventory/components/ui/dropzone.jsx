import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

export function Dropzone({ onDrop }) {
  const handleDrop = useCallback((acceptedFiles) => {
    if (onDrop) {
      onDrop(acceptedFiles);
    }
  }, [onDrop]);

  const { getRootProps, getInputProps } = useDropzone({ onDrop: handleDrop });

  return (
    <div
      {...getRootProps()}
      className="border-dashed border-2 p-4 rounded-lg cursor-pointer text-center"
    >
      <input {...getInputProps()} />
      <p>Drag & drop files here, or click to select files</p>
    </div>
  );
}
