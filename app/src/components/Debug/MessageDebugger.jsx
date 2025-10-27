import { useState } from "react";
import { useWeb3 } from "../../state/Web3Provider.jsx";
import { fetchChatMessages } from "../../lib/queries.js";

export default function MessageDebugger({ chatId }) {
  const { readonlyContract, account } = useWeb3();
  const [debug, setDebug] = useState(null);
  const [loading, setLoading] = useState(false);

  const runDebug = async () => {
    if (!chatId || !readonlyContract) return;
    
    setLoading(true);
    try {
      console.log("[MessageDebugger] Starting debug for chat:", chatId);
      
      // Check contract state
      const contractAddress = readonlyContract.target || readonlyContract.address;
      console.log("[MessageDebugger] Contract address:", contractAddress);
      
      // Try to fetch messages directly
      const messages = await fetchChatMessages(readonlyContract, chatId);
      console.log("[MessageDebugger] Fetched messages:", messages);
      
      setDebug({
        chatId,
        contractAddress,
        account,
        messageCount: messages.length,
        messages: messages.map(msg => ({
          id: msg.id,
          sender: msg.sender,
          cid: msg.cid,
          hasPayload: !!msg.payload,
          payloadType: typeof msg.payload,
          createdAt: msg.createdAt,
          payload: msg.payload
        }))
      });
    } catch (error) {
      console.error("[MessageDebugger] Error:", error);
      setDebug({
        error: error.message,
        stack: error.stack
      });
    } finally {
      setLoading(false);
    }
  };

  if (!chatId) return null;

  return (
    <div style={{ 
      padding: '10px', 
      border: '1px solid #ccc', 
      margin: '10px 0', 
      backgroundColor: '#f5f5f5',
      fontFamily: 'monospace',
      fontSize: '12px'
    }}>
      <div style={{ marginBottom: '10px' }}>
        <strong>Message Debugger</strong>
        <button 
          onClick={runDebug} 
          disabled={loading}
          style={{ marginLeft: '10px', padding: '2px 8px' }}
        >
          {loading ? 'Running...' : 'Debug Messages'}
        </button>
      </div>
      
      {debug && (
        <div>
          <div><strong>Chat ID:</strong> {debug.chatId}</div>
          <div><strong>Contract:</strong> {debug.contractAddress}</div>
          <div><strong>Current Account:</strong> {debug.account}</div>
          <div><strong>Message Count:</strong> {debug.messageCount || 0}</div>
          
          {debug.error ? (
            <div style={{ color: 'red', marginTop: '10px' }}>
              <strong>Error:</strong> {debug.error}
              <pre style={{ fontSize: '10px', marginTop: '5px' }}>{debug.stack}</pre>
            </div>
          ) : debug.messages ? (
            <div style={{ marginTop: '10px' }}>
              <strong>Messages:</strong>
              <pre style={{ 
                backgroundColor: 'white', 
                padding: '10px', 
                marginTop: '5px',
                maxHeight: '300px',
                overflow: 'auto'
              }}>
                {JSON.stringify(debug.messages, null, 2)}
              </pre>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}