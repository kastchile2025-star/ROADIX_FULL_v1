import { useEffect, useState } from 'react';
import { Card, Button, Input } from '../../components/ui';
import api from '../../services/api';
import { authService } from '../../services/auth.service';
import { useI18n } from '../../context/I18nContext';
import toast from 'react-hot-toast';
import type { Taller } from '../../types';

export default function ConfiguracionPage() {
  const { t } = useI18n();
  const [, setTaller] = useState<Taller | null>(null);
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [saving, setSaving] = useState(false);

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [changingPwd, setChangingPwd] = useState(false);

  useEffect(() => {
    api.get<Taller>('/talleres/mi-taller').then((r) => {
      setTaller(r.data);
      setNombre(r.data.nombre);
      setDireccion(r.data.direccion ?? '');
      setTelefono(r.data.telefono ?? '');
    });
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.put<Taller>('/talleres/mi-taller', { nombre, direccion, telefono });
      setTaller(data);
      toast.success(t('config.toastDatosActualizados'));
    } catch {
      toast.error(t('config.toastErrorGuardar'));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPwd.length < 6) { toast.error(t('config.toastPasswordCorta')); return; }
    if (newPwd !== confirmPwd) { toast.error(t('config.toastPasswordNoCoincide')); return; }
    setChangingPwd(true);
    try {
      await authService.changePassword(currentPwd, newPwd);
      toast.success(t('config.toastPasswordActualizada'));
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } catch {
      toast.error(t('config.toastPasswordIncorrecta'));
    } finally {
      setChangingPwd(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('config.title')}</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Datos del taller */}
        <Card title={t('config.datosTaller')}>
          <div className="space-y-4">
            <Input label={t('config.labelNombreTaller')} value={nombre} onChange={(e) => setNombre(e.target.value)} />
            <Input label={t('config.labelDireccion')} value={direccion} onChange={(e) => setDireccion(e.target.value)} />
            <Input label={t('config.labelTelefono')} value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            <div className="flex justify-end">
              <Button onClick={save} loading={saving}>{t('config.guardarCambios')}</Button>
            </div>
          </div>
        </Card>


      </div>

      {/* Cambiar contraseña */}
      <Card title={t('config.cambiarPassword')}>
        <div className="max-w-md space-y-4">
          <Input
            label={t('config.labelPasswordActual')}
            type="password"
            autoComplete="current-password"
            value={currentPwd}
            onChange={(e) => setCurrentPwd(e.target.value)}
          />
          <Input
            label={t('config.labelPasswordNueva')}
            type="password"
            autoComplete="new-password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
          />
          <Input
            label={t('config.labelPasswordConfirmar')}
            type="password"
            autoComplete="new-password"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
          />
          <div className="flex justify-end">
            <Button onClick={handleChangePassword} loading={changingPwd} variant="secondary">
              {t('config.btnCambiarPassword')}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
