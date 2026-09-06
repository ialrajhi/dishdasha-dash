import { execFileSync } from 'node:child_process';
import { cp, mkdir, readFile, writeFile, access, realpath } from 'node:fs/promises';
import { join, isAbsolute, relative } from 'node:path';
import { createHash } from 'node:crypto';

const signed = process.argv.includes('--signed');
const keys = ['DASH_UPLOAD_KEYSTORE', 'DASH_UPLOAD_STORE_PASSWORD', 'DASH_UPLOAD_KEY_ALIAS', 'DASH_UPLOAD_KEY_PASSWORD'];
if (signed) {
  if (keys.some(key => !process.env[key]?.trim())) throw Error('Set all four DASH_UPLOAD_* environment values before creating an upload-signed bundle. See store/google-play/signing.md.');
  if (!isAbsolute(process.env.DASH_UPLOAD_KEYSTORE)) throw Error('DASH_UPLOAD_KEYSTORE must be an absolute path outside this repository.');
  await access(process.env.DASH_UPLOAD_KEYSTORE);
  const keyPath = await realpath(process.env.DASH_UPLOAD_KEYSTORE);
  const within = relative(await realpath(process.cwd()), keyPath);
  if (!within.startsWith("..") && !isAbsolute(within)) throw Error("Keep the upload keystore outside this repository.");
}
const env = {...process.env};
if (!env.JAVA_HOME && process.platform === 'darwin') env.JAVA_HOME = '/Applications/Android Studio.app/Contents/jbr/Contents/Home';
const node = (...args) => execFileSync(process.execPath, args, {stdio:'inherit', env});
node('scripts/licenses.mjs');
node('node_modules/typescript/bin/tsc', '--noEmit');
node('node_modules/vite/bin/vite.js', 'build');
node('node_modules/@capacitor/cli/bin/capacitor', 'sync', 'android');
execFileSync(process.platform === 'win32' ? 'gradlew.bat' : './gradlew', [':app:assembleDebug', ':app:bundleRelease', ':app:lintRelease', ...(signed ? ['-PdashUploadSigning=true'] : [])], {cwd:'android', env, stdio:'inherit'});
const {version} = JSON.parse(await readFile('package.json','utf8'));
const apk = 'android/app/build/outputs/apk/debug/app-debug.apk';
const aab = 'android/app/build/outputs/bundle/release/app-release.aab';
const jarSigner = env.JAVA_HOME ? join(env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'jarsigner.exe' : 'jarsigner') : 'jarsigner';
const verification = execFileSync(jarSigner, ['-verify', aab], {encoding:'utf8',env});
if (signed && !verification.includes('jar verified.')) throw Error('The release bundle is not signed. It will not be labeled upload-signed.');
if (!signed && !verification.includes('jar is unsigned.')) throw Error('Unexpected signing state for a test bundle. Inspect the Gradle signing configuration.');
const folder='release/android';await mkdir(folder,{recursive:true});
const apkName=`Dishdasha-Dash-${version}-test.apk`;
const aabName=`Dishdasha-Dash-${version}-${signed ? 'upload-signed' : 'unsigned'}.aab`;
await cp(apk,`${folder}/${apkName}`);await cp(aab,`${folder}/${aabName}`);
const files={};for(const name of [apkName,aabName]){const bytes=await readFile(`${folder}/${name}`);files[name]={bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};}
await writeFile(`${folder}/Dishdasha-Dash-${version}-manifest.json`,JSON.stringify({version,createdAt:new Date().toISOString(),appId:'com.falrajhi.dishdashadash',uploadSigned:signed,files},null,2)+'\n');
console.log(`Prepared Android ${version}: test APK and ${signed ? 'upload-signed' : 'unsigned'} AAB. This does not submit to Google Play.`);
