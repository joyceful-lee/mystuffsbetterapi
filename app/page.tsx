import { currentUser } from '../lib/auth';
import BinderApp from '../components/binder-app';
export const dynamic='force-dynamic';
export default async function Home(){const user=await currentUser();return <BinderApp user={user?{id:user.id,name:user.name,email:user.email}:null}/>;}
