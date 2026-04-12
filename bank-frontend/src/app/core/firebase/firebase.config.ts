// Banque — Firebase Configuration
// Reads from centralized environment file

import { environment } from '@env/environment';

export const firebaseConfig = environment.firebase;
