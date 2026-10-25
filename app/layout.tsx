import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import './theme.css';
import { DisplayModeProvider } from '../components/display-mode';
const reading = localFont({src:[
 {path:'../public/fonts/atkinson-400.ttf',weight:'400'},
 {path:'../public/fonts/atkinson-500.ttf',weight:'500'},
 {path:'../public/fonts/atkinson-600.ttf',weight:'600'},
 {path:'../public/fonts/atkinson-700.ttf',weight:'700'},
],variable:'--font-reading',display:'swap'});
const display = localFont({src:[
 {path:'../public/fonts/fredoka-500.ttf',weight:'500'},
 {path:'../public/fonts/fredoka-600.ttf',weight:'600'},
 {path:'../public/fonts/fredoka-700.ttf',weight:'700'},
],variable:'--font-display',display:'swap'});
export const metadata:Metadata={title:'MyStuffsBetter | Card binders',description:'Organize your trading cards in personal binders and share a view of your collection.',robots:{index:false,follow:false},icons:{icon:'/favicon.svg'}};
export default function Layout({children}:{children:React.ReactNode}) {return <html lang="en" className={`${reading.variable} ${display.variable}`}><body><DisplayModeProvider>{children}</DisplayModeProvider></body></html>;}
