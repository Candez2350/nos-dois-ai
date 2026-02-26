export const dynamic = 'force-dynamic';
export default function DebugPage() {
  return (
    <div style={{ padding: '50px', fontFamily: 'sans-serif' }}>
      <h1>🛠️ Diagnóstico do NósDois.ai</h1>
      <p>Se você está vendo isso, o servidor está funcionando.</p>
      <p>Horário: {new Date().toISOString()}</p>
    </div>
  );
}