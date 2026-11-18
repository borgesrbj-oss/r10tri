'use client';
import {useTheme} from 'next-themes';
import {Sun,Moon} from 'lucide-react';
export function ThemePreference(){
  const {setTheme}=useTheme();
  return <div className="flex items-center gap-1 rounded-full border bg-card p-1" aria-label="Aparência"><button type="button" aria-label="Usar tema claro" title="Tema claro" className="rounded-full p-2 hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" onClick={()=>setTheme('light')}><Sun className="h-4 w-4" /></button><button type="button" aria-label="Usar tema escuro" title="Tema escuro" className="rounded-full p-2 hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" onClick={()=>setTheme('dark')}><Moon className="h-4 w-4" /></button></div>;
}
