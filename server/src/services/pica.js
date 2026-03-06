import { config } from '../config/env.js';

const PICA_API_BASE = 'https://api.picaos.com';
const IDENTITY = 'brandon-hinrichs';

/**
 * Generate an AuthKit token for the frontend widget
 */
export async function generateAuthKitToken() {
  const { AuthKitToken } = await import('@picahq/authkit-token');

  const token = await AuthKitToken.create(config.picaSecretKey, {
    identity: IDENTITY,
    identityType: 'user',
  });

  return token;
}

/**
 * Get connected integrations for this user identity
 */
export async function getConnectedIntegrations() {
  const response = await fetch(`${PICA_API_BASE}/v1/vault/connections`, {
    headers: {
      'Authorization': `Bearer ${config.picaSecretKey}`,
      'x-pica-identity': IDENTITY,
      'x-pica-identity-type': 'user',
    },
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Pica API error: ${err}`);
  }

  return response.json();
}

/**
 * Post to social media via Pica passthrough API
 */
export async function postToSocialMedia({ platform, message, imageUrl, connectionKey, platformConfig = {} }) {
  let path = '';
  let body = {};

  switch (platform) {
    case 'facebook': {
      const pageId = platformConfig.pageId || 'me';
      if (imageUrl) {
        path = `/${pageId}/photos`;
        body = { url: imageUrl, message };
      } else {
        path = `/${pageId}/feed`;
        body = { message };
      }
      break;
    }
    case 'instagram': {
      const igUserId = platformConfig.igUserId;
      if (!igUserId) throw new Error('Instagram user ID required in platformConfig.igUserId');
      // Step 1: Create media container
      const containerBody = { caption: message };
      if (imageUrl) containerBody.image_url = imageUrl;

      const containerRes = await picaPassthrough(connectionKey, 'POST', `/${igUserId}/media`, containerBody);
      const containerId = containerRes.id;

      // Step 2: Publish
      path = `/${igUserId}/media_publish`;
      body = { creation_id: containerId };
      break;
    }
    case 'linkedin': {
      path = '/ugcPosts';
      body = {
        author: platformConfig.authorUrn || platformConfig.author,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: message },
            shareMediaCategory: imageUrl ? 'IMAGE' : 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      };
      break;
    }
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }

  return picaPassthrough(connectionKey, 'POST', path, body);
}

/**
 * Generic Pica passthrough request
 */
export async function picaPassthrough(connectionKey, method, path, body = null) {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.picaSecretKey}`,
      'x-pica-connection-key': connectionKey,
    },
    body: JSON.stringify({
      method,
      path,
      ...(body && { body }),
    }),
  };

  const response = await fetch(`${PICA_API_BASE}/v1/passthrough`, options);

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Pica passthrough error: ${err}`);
  }

  return response.json();
}

/**
 * Fetch data from a connected integration (generic scraping/pulling)
 */
export async function fetchFromIntegration(connectionKey, method, path) {
  return picaPassthrough(connectionKey, method, path);
}
