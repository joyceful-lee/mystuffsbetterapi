import AuthForm from '../../components/auth-form';
import { DisplayModeSwitch } from '../../components/display-mode';

export default async function ResetPassword({searchParams}:{searchParams:Promise<{token?:string|string[];error?:string|string[]}>}) {
 const params=await searchParams;
 const token=typeof params.token==='string'?params.token:'';
 return <main className="password-page"><div className="password-panel"><DisplayModeSwitch/><a className="text-button" href="/">Back to collection</a><h1>Reset your password</h1><AuthForm initial="reset" token={token} invalidLink={!!params.error}/></div></main>;
}
