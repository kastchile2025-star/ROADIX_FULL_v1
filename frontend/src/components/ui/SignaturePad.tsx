import { useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Eraser } from 'lucide-react';
import { Button } from './Button';

interface SignaturePadProps {
  label?: string;
  value?: string | null;
  onChange: (dataUrl: string | null) => void;
  height?: number;
  disabled?: boolean;
}

export function SignaturePad({
  label = 'Firma del Cliente',
  value,
  onChange,
  height = 200,
  disabled = false,
}: SignaturePadProps) {
  const sigRef = useRef<SignatureCanvas | null>(null);

  useEffect(() => {
    if (value && sigRef.current && sigRef.current.isEmpty()) {
      sigRef.current.fromDataURL(value);
    }
  }, [value]);

  const handleClear = () => {
    sigRef.current?.clear();
    onChange(null);
  };

  const handleEnd = () => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      onChange(sigRef.current.toDataURL('image/png'));
    }
  };

  if (disabled && value) {
    return (
      <div>
        {label && (
          <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>
        )}
        <div className="border rounded-lg bg-gray-50 p-2">
          <img
            src={value}
            alt="Firma"
            className="max-h-40 mx-auto"
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      {label && (
        <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>
      )}
      <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white relative">
        <SignatureCanvas
          ref={sigRef}
          canvasProps={{
            className: 'w-full rounded-lg',
            height,
            style: { width: '100%', height },
          }}
          penColor="#1e293b"
          onEnd={handleEnd}
        />
        <div className="absolute bottom-2 right-2 flex gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClear}
            className="!px-2 !py-1 text-xs"
          >
            <Eraser size={14} className="mr-1" /> Limpiar
          </Button>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-1">
        Dibuje su firma en el recuadro
      </p>
    </div>
  );
}
