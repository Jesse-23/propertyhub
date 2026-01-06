import { supabase } from './lib/supabase';

async function testSignup() {
  const { data, error } = await supabase.auth.signUp({
    email: 'jessemaduka85@gmail.com',
    password: 'password123'
  });

  console.log(data, error);
}

testSignup();
