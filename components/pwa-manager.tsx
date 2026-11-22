'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { Download, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function subscribeConnectivity(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function subscribeDisplayMode(callback: () => void) {
  const media = window.matchMedia('(display-mode: standalone)');
  if (typeof media.addEventListener === 'function') media.addEventListener('change', callback);
  else media.addListener(callback);
  window.addEventListener('appinstalled', callback);
  return () => {
    if (typeof media.removeEventListener === 'function') media.removeEventListener('change', callback);
    else media.removeListener(callback);
    window.removeEventListener('appinstalled', callback);
  };
}

function installedSnapshot() {
  return window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

export function PwaManager() {
  const online = useSyncExternalStore(subscribeConnectivity, () => navigator.onLine, () => true);
  const installed = useSyncExternalStore(subscribeDisplayMode, installedSnapshot, () => false);
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null);
  const [instructions, setInstructions] = useState(false);
  const [registrationFailed, setRegistrationFailed] = useState(false);
  const [environment, setEnvironment] = useState({ secure: true, push: false });

  useEffect(() => {
    const capturePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPrompt);
    };
    const completeInstall = () => setInstallPrompt(null);
    window.addEventListener('beforeinstallprompt', capturePrompt);
    window.addEventListener('appinstalled', completeInstall);
    if (process.env.NODE_ENV === 'production' && window.isSecureContext && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch(() => setRegistrationFailed(true));
    }
    return () => {
      window.removeEventListener('beforeinstallprompt', capturePrompt);
      window.removeEventListener('appinstalled', completeInstall);
    };
  }, []);

  async function install() {
    setEnvironment({ secure: window.isSecureContext, push: 'PushManager' in window && 'Notification' in window && 'serviceWorker' in navigator });
    if (installPrompt) {
      try {
        await installPrompt.prompt();
        await installPrompt.userChoice;
        setInstallPrompt(null);
        return;
      } catch {
        setInstallPrompt(null);
      }
    }
    setInstructions(true);
  }

  return (
    <>
      <footer className="pwa-utility border-t bg-background px-4 py-3 text-sm text-muted-foreground">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3">
          {!online ? (
            <p className="flex items-center gap-2" role="status"><WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" /> Sem conexão. Reconecte antes de salvar seus treinos.</p>
          ) : <span>Gotri no computador e no celular</span>}
          {!installed && <Button type="button" variant="outline" size="sm" onClick={install} className="min-h-11 gap-2"><Download className="h-4 w-4" aria-hidden="true" /> Instalar aplicativo</Button>}
        </div>
        {registrationFailed && <p className="mx-auto mt-2 max-w-[1200px]" role="status">Não foi possível preparar a instalação agora. Você pode continuar usando o navegador.</p>}
      </footer>
      <Dialog open={instructions} onOpenChange={setInstructions}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Leve o Gotri para sua tela inicial</DialogTitle>
            <DialogDescription>A instalação depende das opções oferecidas pelo seu navegador.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            {!environment.secure && <p role="alert" className="rounded-md border border-amber-500/40 p-3">Abra o endereço público HTTPS do app para instalar. Um endereço HTTP da rede local não habilita os recursos de PWA no celular.</p>}
            <p><strong>iPhone ou iPad:</strong> abra o menu Compartilhar do navegador e escolha Adicionar à Tela de Início. Se aparecer a opção Abrir como App da Web, mantenha-a ativada.</p>
            <p><strong>Android ou Chrome no computador:</strong> use Instalar aplicativo ou Adicionar à tela inicial no menu do navegador. No computador, a opção também pode aparecer na barra de endereço.</p>
            <p><strong>Safari no Mac:</strong> use Arquivo → Adicionar ao Dock, quando essa opção estiver disponível.</p>
            <p>Para proteger seus dados, o modo sem conexão mostra apenas uma orientação de reconexão. O app não guarda telas ou respostas de atletas no cache do service worker.</p>
            <p className="text-muted-foreground">{environment.push ? 'Este navegador oferece APIs de notificações. O envio de notificações push ainda depende da configuração do serviço no servidor; no iPhone, também exige o app na tela inicial.' : 'Notificações push não estão disponíveis neste contexto. Isso não impede o uso normal do app.'} Nenhuma permissão de notificação é solicitada automaticamente.</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
