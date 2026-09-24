import { redirect } from 'next/navigation';

export default function AnggaranUangMakanRedirect() {
  redirect('/dana-pemerintah?tab=uang-makan');
}
