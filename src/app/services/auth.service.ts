import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly authKey = 'remindfy-authenticated';
  private readonly validEmail = 'user@example.com';
  private readonly validPassword = 'password123';
  private router = inject(Router);

  login(email: string, password: string): boolean {
    if (email === this.validEmail && password === this.validPassword) {
      localStorage.setItem(this.authKey, 'true');
      return true;
    }

    return false;
  }

  logout(): void {
    localStorage.removeItem(this.authKey);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return localStorage.getItem(this.authKey) === 'true';
  }

  setAuthenticated(authenticated: boolean): void {
    if (authenticated) {
      localStorage.setItem(this.authKey, 'true');
    } else {
      localStorage.removeItem(this.authKey);
    }
  }
}
