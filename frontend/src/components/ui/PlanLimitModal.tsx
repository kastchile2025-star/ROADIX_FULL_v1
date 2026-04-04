import { AlertTriangle, ArrowUpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Modal } from './Modal';
import { Button } from './Button';
import { useI18n } from '../../context/I18nContext';

interface PlanLimitModalProps {
  open: boolean;
  onClose: () => void;
  /** Resource type that hit the limit */
  resource: 'usuarios' | 'vehiculos' | 'ots' | 'storage';
  /** Current count */
  usado?: number;
  /** Plan limit */
  limite?: number;
}

export function PlanLimitModal({ open, onClose, resource, usado, limite }: PlanLimitModalProps) {
  const { t } = useI18n();
  const navigate = useNavigate();

  const resourceLabels: Record<string, string> = {
    usuarios: t('planLimit.usuarios'),
    vehiculos: t('planLimit.vehiculos'),
    ots: t('planLimit.ots'),
    storage: t('planLimit.storage'),
  };

  const handleUpgrade = () => {
    onClose();
    navigate('/billing');
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex flex-col items-center text-center py-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
          <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
        </div>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {t('planLimit.title')}
        </h3>

        <p className="text-gray-600 dark:text-gray-400 mb-2">
          {t('planLimit.message').replace('{resource}', resourceLabels[resource] ?? resource)}
        </p>

        {usado !== undefined && limite !== undefined && (
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
            {t('planLimit.usage')
              .replace('{usado}', String(usado))
              .replace('{limite}', String(limite))}
          </p>
        )}

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          {t('planLimit.upgradeHint')}
        </p>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose}>
            {t('planLimit.close')}
          </Button>
          <Button onClick={handleUpgrade}>
            <ArrowUpCircle size={16} className="mr-1" />
            {t('planLimit.upgrade')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
