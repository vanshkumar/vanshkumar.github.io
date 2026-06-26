import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { scrubQueryInviteSecretsFromLocation } from './persistence/remoteSession';
import './index.css';

const queryInviteSecretsScrubbed = scrubQueryInviteSecretsFromLocation();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App queryInviteSecretsScrubbed={queryInviteSecretsScrubbed} />
  </React.StrictMode>,
);
