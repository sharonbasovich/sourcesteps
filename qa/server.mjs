import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';

// QA owns only this child. Never poll an occupied port and test another checkout.
export async function startServer(port){
 if(!/^\d+$/.test(String(port))||Number(port)<1||Number(port)>65535)throw Error('Invalid QA port');
 const source=(await readFile('server.js','utf8')).replaceAll('4173',String(port));
 const server=spawn(process.execPath,['--input-type=module','-e',source]);
 const origin=`http://127.0.0.1:${port}/`;
 try{
  await new Promise((resolve,reject)=>{
   let output='',errors='';const timer=setTimeout(()=>fail(Error('Owned QA server startup timed out')),5000);
   const cleanup=()=>{clearTimeout(timer);server.off('error',fail);server.off('exit',exited);server.stdout.off('data',data);server.stderr.off('data',stderr);};
   const fail=error=>{cleanup();reject(error);};
   const exited=code=>fail(Error(`Owned QA server exited before readiness (${code}): ${errors}`));
   const stderr=chunk=>{errors+=chunk;};
   const data=chunk=>{output+=chunk;if(output.includes(`SourceSteps: http://127.0.0.1:${port}\n`)){cleanup();resolve();}};
   server.on('error',fail);server.on('exit',exited);server.stdout.on('data',data);server.stderr.on('data',stderr);
  });
  const response=await fetch(origin+'app.js',{signal:AbortSignal.timeout(5000)});
  if(response.status!==200||!Buffer.from(await response.arrayBuffer()).equals(await readFile('app.js')))throw Error('QA server app bytes differ from this checkout');
  return {server,origin};
 }catch(error){server.kill();throw error;}
}
