import { Amplify } from 'aws-amplify';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: environment.cognitoPoolId,
      userPoolClientId: environment.cognitoClientId,
      loginWith: {
        oauth: {
          domain: environment.cognitoDomain,
          scopes: ['openid', 'email', 'profile'],
          redirectSignIn: [environment.cognitoCallbackUrl],
          redirectSignOut: [environment.cognitoCallbackUrl],
          responseType: 'code',
          providers: ['Google', { custom: 'LinkedIn' }],
        },
      },
    },
  },
});

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
