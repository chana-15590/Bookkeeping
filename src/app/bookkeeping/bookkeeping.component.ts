import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import * as XLSX from 'xlsx';

interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  client: string;
  id?: string;
}

@Component({
  selector: 'app-bookkeeping',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- מערכת הודעות -->
    <div class="notifications-container">
      <div *ngFor="let notification of notifications" 
           class="notification" 
           [class]="'notification--' + notification.type"
           [class.notification--visible]="notification.visible"
           (click)="removeNotification(notification.id)">
        <div class="notification-content">
          <svg class="notification-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path *ngIf="notification.type === 'success'" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            <path *ngIf="notification.type === 'error'" d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
            <path *ngIf="notification.type === 'info'" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,17A1.5,1.5 0 0,1 10.5,15.5A1.5,1.5 0 0,1 12,14A1.5,1.5 0 0,1 13.5,15.5A1.5,1.5 0 0,1 12,17M12,10A1,1 0 0,1 11,9V7A1,1 0 0,1 12,6A1,1 0 0,1 13,7V9A1,1 0 0,1 12,10Z"/>
          </svg>
          <span class="notification-message">{{notification.message}}</span>
          <button class="notification-close" (click)="removeNotification(notification.id); $event.stopPropagation()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div class="app-layout">
      
      <!-- Header -->
      <header class="app-header">
        <div class="container">
          <div class="header-content">
            <div class="brand">
              <div class="brand-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                </svg>
              </div>
              <div class="brand-text">
                <h1>מערכת הנהלת חשבונות</h1>
                <span class="brand-subtitle">ניהול כספי מקצועי</span>
              </div>
            </div>
            
            <div class="header-info">
              <div class="summary-item">
                <span class="summary-label">סה"כ עסקאות</span>
                <span class="summary-value">{{transactions.length}}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="main-content">
        <div class="container">
          
          <!-- Page Title -->
          <div class="page-header">
            <h2>לוח בקרה כספי</h2>
            <p class="page-description">ניהול ומעקב אחר הכנסות והוצאות עסקיות</p>
          </div>

          <!-- Statistics Row -->
          <div class="stats-row">
            <div class="stat-card stat-card--income">
              <div class="stat-card__content">
                <div class="stat-card__header">
                  <span class="stat-card__icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
                    </svg>
                  </span>
                  <span class="stat-card__title">הכנסות</span>
                </div>
                <div class="stat-card__value">{{getTotalIncome() | number:'1.2-2'}} ₪</div>
              </div>
            </div>

            <div class="stat-card stat-card--expense">
              <div class="stat-card__content">
                <div class="stat-card__header">
                  <span class="stat-card__icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16 18l2.29-2.29-4.88-4.88-4 4L2 7.41 3.41 6l6 6 4-4 6.3 6.29L22 12v6z"/>
                    </svg>
                  </span>
                  <span class="stat-card__title">הוצאות</span>
                </div>
                <div class="stat-card__value">{{getTotalExpenses() | number:'1.2-2'}} ₪</div>
              </div>
            </div>

            <div class="stat-card stat-card--profit">
              <div class="stat-card__content">
                <div class="stat-card__header">
                  <span class="stat-card__icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </span>
                  <span class="stat-card__title">יתרה</span>
                </div>
                <div class="stat-card__value">{{getNetProfit() | number:'1.2-2'}} ₪</div>
              </div>
            </div>
          </div>

          <!-- Content Grid -->
          <div class="content-grid">
            
            <!-- File Upload Section -->
            <section class="card">
              <div class="card-header">
                <h3 class="card-title">
                  <svg class="card-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                  העלאת קבצים
                </h3>
              </div>
              <div class="card-body">
                <div class="upload-area" 
                     (click)="fileInput.click()"
                     (dragover)="onDragOver($event)"
                     (dragleave)="onDragLeave($event)"
                     (drop)="onDrop($event)"
                     [class.drag-over]="isDragOver">
                  <input #fileInput type="file" accept=".csv,.xlsx,.xls,.json" (change)="onFileSelected($event)" hidden>
                  <div class="upload-content">
                    <svg class="upload-icon" width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                    <h4>{{isDragOver ? 'שחרר כאן את הקובץ' : 'העלה קובץ נתונים'}}</h4>
                    <p>{{isDragOver ? 'שחרר כדי להעלות את הקובץ' : 'לחץ כאן או גרור קובץ לאזור זה'}}</p>
                    <small>פורמטים נתמכים:  Excel (XLSX/XLS), JSON</small>
                    <div class="file-format-info">
                      <details>
                        <summary>מבנה קבצים נדרש</summary>
                        <div class="format-details">
                          <p>(תאריך, סכום, תיאור, סוג עסקה, לקוח)</p>
                        </div>
                      </details>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- Add Transaction Form -->
            <section class="card">
              <div class="card-header">
                <h3 class="card-title">
                  <svg class="card-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
                  </svg>
                  הוספת עסקה חדשה
                </h3>
              </div>
              <div class="card-body">
                <form (ngSubmit)="addTransaction()" class="form">
                  <div class="form-group">
                    <label for="date" class="form-label">תאריך עסקה</label>
                    <input 
                      id="date"
                      type="date" 
                      [(ngModel)]="newTransaction.date" 
                      name="date" 
                      required 
                      class="form-input">
                  </div>
                  
                  <div class="form-group">
                    <label for="description" class="form-label">תיאור העסקה</label>
                    <input 
                      id="description"
                      type="text" 
                      [(ngModel)]="newTransaction.description" 
                      name="description" 
                      required 
                      placeholder="הזן תיאור מפורט של העסקה"
                      class="form-input">
                  </div>
                  
                  <div class="form-row">
                    <div class="form-group">
                      <label for="amount" class="form-label">סכום (₪)</label>
                      <input 
                        id="amount"
                        type="number" 
                        [(ngModel)]="newTransaction.amount" 
                        name="amount" 
                        required 
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        class="form-input">
                    </div>
                    
                    <div class="form-group">
                      <label for="type" class="form-label">סוג העסקה</label>
                      <select 
                        id="type"
                        [(ngModel)]="newTransaction.type" 
                        name="type" 
                        required
                        class="form-select">
                        <option value="">בחר סוג עסקה</option>
                        <option value="income">הכנסה</option>
                        <option value="expense">הוצאה</option>
                      </select>
                    </div>
                  </div>
                  
                  <div class="form-row">
                    <div class="form-group">
                      <label for="client" class="form-label">לקוח/ספק</label>
                      <input 
                        id="client"
                        type="text" 
                        [(ngModel)]="newTransaction.client" 
                        name="client" 
                        required 
                        placeholder="שם הלקוח או הספק"
                        class="form-input">
                    </div>
                  </div>
                  
                  <div class="form-actions">
                    <button type="submit" class="btn btn--primary">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17,9H7V7H17M17,13H7V11H17M14,17H7V15H14M12,3A1,1 0 0,1 13,4A1,1 0 0,1 12,5A1,1 0 0,1 11,4A1,1 0 0,1 12,3M19,3H14.82C14.4,1.84 13.3,1 12,1C10.7,1 9.6,1.84 9.18,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3Z"/>
                      </svg>
                      שמור עסקה
                    </button>
                  </div>
                </form>
              </div>
            </section>

          </div>

          <!-- Transactions Table -->
          <section class="card transactions-card">
            <div class="card-header">
              <h3 class="card-title">
                <svg class="card-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,3H21V5H3V3M3,7H21V9H3V7M3,11H21V13H3V11M3,15H21V17H3V15M3,19H21V21H3V19Z"/>
                </svg>
                רשימת עסקאות
              </h3>
              <div class="card-actions">
                <button (click)="exportToExcel()" class="btn btn--secondary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                  ייצא Excel
                </button>
                <button (click)="clearAllData()" class="btn btn--danger">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z"/>
                  </svg>
                  נקה הכל
                </button>
              </div>
            </div>
            
            <div class="card-body" [class.no-padding]="transactions.length > 0">
              <div class="table-container" *ngIf="transactions.length > 0">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>תאריך</th>
                      <th>תיאור</th>
                      <th>סכום</th>
                      <th>סוג</th>
                      <th>לקוח/ספק</th>
                      <th class="actions-col">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let transaction of transactions; let i = index" 
                        [class.row--income]="transaction.type === 'income'"
                        [class.row--expense]="transaction.type === 'expense'">
                      <td class="cell--date">{{transaction.date | date:'dd/MM/yyyy'}}</td>
                      <td class="cell--description">{{transaction.description}}</td>
                      <td class="cell--amount" [class]="'amount--' + transaction.type">
                        {{transaction.amount | number:'1.2-2'}} ₪
                      </td>
                      <td class="cell--type">
                        <span class="badge" [class]="'badge--' + transaction.type">
                          {{transaction.type === 'income' ? 'הכנסה' : 'הוצאה'}}
                        </span>
                      </td>
                      <td class="cell--client">{{transaction.client}}</td>
                      <td class="cell--actions">
                        <button 
                          (click)="deleteTransaction(i)" 
                          class="btn btn--danger btn--sm"
                          title="מחק עסקה">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div *ngIf="transactions.length === 0" class="empty-state">
                <svg class="empty-icon" width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z"/>
                </svg>
                <h4>אין עסקאות עדיין</h4>
                <p>התחל בהעלאת קובץ נתונים (CSV, Excel, JSON) או הוסף עסקה חדשה באמצעות הטופס למעלה</p>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  `,
  styles: [`
    /* מערכת הודעות */
    .notifications-container {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 400px;
    }

    .notification {
      background: var(--white);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      box-shadow: var(--shadow-lg);
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease-in-out;
      cursor: pointer;
      overflow: hidden;
    }

    .notification--visible {
      opacity: 1;
      transform: translateX(0);
    }

    .notification--success {
      border-right: 4px solid var(--success-color);
    }

    .notification--error {
      border-right: 4px solid var(--danger-color);
    }

    .notification--info {
      border-right: 4px solid var(--accent-color);
    }

    .notification-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
    }

    .notification-icon {
      flex-shrink: 0;
    }

    .notification--success .notification-icon {
      color: var(--success-color);
    }

    .notification--error .notification-icon {
      color: var(--danger-color);
    }

    .notification--info .notification-icon {
      color: var(--accent-color);
    }

    .notification-message {
      flex: 1;
      font-size: 0.875rem;
      color: var(--gray-700);
      line-height: 1.4;
    }

    .notification-close {
      background: none;
      border: none;
      color: var(--gray-400);
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 4px;
      transition: var(--transition);
      flex-shrink: 0;
    }

    .notification-close:hover {
      background: var(--gray-100);
      color: var(--gray-600);
    }

    .notification:hover {
      box-shadow: var(--shadow-xl);
    }

    /* Layout עסקי מקצועי */
    .app-layout {
      min-height: 100vh;
      background: var(--gray-50);
    }

    .container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }

    /* Header מקצועי */
    .app-header {
      background: var(--white);
      border-bottom: 1px solid var(--border-color);
      box-shadow: var(--shadow-sm);
      position: sticky;
      top: 0;
      z-index: 50;
    }

    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 0;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .brand-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background: var(--primary-color);
      color: var(--white);
      border-radius: var(--border-radius-lg);
    }

    .brand-text h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--gray-900);
      margin: 0;
      line-height: 1.2;
    }

    .brand-subtitle {
      font-size: 0.875rem;
      color: var(--gray-600);
    }

    .header-info {
      display: flex;
      gap: 1.5rem;
    }

    .summary-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .summary-label {
      font-size: 0.75rem;
      color: var(--gray-500);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 500;
    }

    .summary-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--primary-color);
      margin-top: 0.25rem;
    }

    /* Main Content */
    .main-content {
      padding: 2rem 0;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .page-header h2 {
      font-size: 1.875rem;
      font-weight: 700;
      color: var(--gray-900);
      margin-bottom: 0.5rem;
    }

    .page-description {
      font-size: 1rem;
      color: var(--gray-600);
      margin: 0;
    }

    /* Statistics Row */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: var(--white);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      padding: 1.5rem;
      box-shadow: var(--shadow-sm);
      transition: var(--transition);
    }

    .stat-card:hover {
      box-shadow: var(--shadow-md);
    }

    .stat-card--income {
      border-right: 4px solid var(--success-color);
    }

    .stat-card--expense {
      border-right: 4px solid var(--danger-color);
    }

    .stat-card--profit {
      border-right: 4px solid var(--accent-color);
    }

    .stat-card__content {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .stat-card__header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .stat-card__icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: var(--border-radius);
      background: var(--gray-100);
      color: var(--gray-600);
    }

    .stat-card--income .stat-card__icon {
      background: rgba(56, 161, 105, 0.1);
      color: var(--success-color);
    }

    .stat-card--expense .stat-card__icon {
      background: rgba(229, 62, 62, 0.1);
      color: var(--danger-color);
    }

    .stat-card--profit .stat-card__icon {
      background: rgba(30, 64, 175, 0.1);
      color: var(--accent-color);
    }

    .stat-card__title {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--gray-600);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .stat-card__value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--gray-900);
      line-height: 1;
    }

    /* Content Grid */
    .content-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 2rem;
      margin-bottom: 2rem;
    }

    /* Cards */
    .card {
      background: var(--white);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }

    .card-header {
      background: var(--gray-50);
      border-bottom: 1px solid var(--border-color);
      padding: 1.25rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .card-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--gray-900);
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .card-icon {
      color: var(--gray-500);
    }

    .card-body {
      padding: 1.5rem;
    }

    .card-body.no-padding {
      padding: 0;
    }

    .card-actions {
      display: flex;
      gap: 0.75rem;
    }

    /* Upload Area */
    .upload-area {
      border: 2px dashed var(--border-color);
      border-radius: var(--border-radius);
      padding: 3rem 2rem;
      text-align: center;
      cursor: pointer;
      transition: var(--transition);
      background: var(--gray-50);
    }

    .upload-area:hover {
      border-color: var(--accent-color);
      background: rgba(15, 43, 119, 0.05);
    }

    .upload-area.drag-over {
      border-color: var(--accent-color);
      background: rgba(15, 43, 119, 0.1);
      box-shadow: 0 0 0 3px rgba(15, 43, 119, 0.1);
      transform: scale(1.02);
    }

    .upload-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .upload-icon {
      color: var(--gray-400);
    }

    .upload-content h4 {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--gray-700);
      margin: 0;
    }

    .upload-content p {
      color: var(--gray-500);
      margin: 0;
    }

    .upload-content small {
      color: var(--gray-400);
      font-size: 0.75rem;
    }

    .file-format-info {
      margin-top: 1rem;
      text-align: right;
    }

    .file-format-info details {
      background: var(--gray-50);
      padding: 0.75rem;
      border-radius: var(--border-radius);
      border: 1px solid var(--border-color);
    }

    .file-format-info summary {
      cursor: pointer;
      font-weight: 500;
      color: var(--accent-color);
      font-size: 0.875rem;
    }

    .file-format-info summary:hover {
      color: var(--primary-color);
    }

    .format-details {
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border-color);
    }

    .format-details h5, .format-details h6 {
      margin: 0.5rem 0 0.25rem 0;
      color: var(--gray-700);
      font-size: 0.8125rem;
    }

    .format-details p {
      margin: 0.25rem 0;
      font-size: 0.8125rem;
      color: var(--gray-600);
    }

    .format-details code {
      display: block;
      background: var(--white);
      padding: 0.5rem;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.75rem;
      border: 1px solid var(--border-color);
      direction: ltr;
      text-align: left;
      overflow-x: auto;
    }

    /* Forms */
    .form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--gray-700);
    }

    .form-input,
    .form-select {
      padding: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      font-size: 0.875rem;
      transition: var(--transition);
      background: var(--white);
    }

    .form-input:focus,
    .form-select:focus {
      outline: none;
      border-color: var(--accent-color);
      box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
    }

    .form-input::placeholder {
      color: var(--gray-400);
    }

    .form-actions {
      margin-top: 0.5rem;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      border: 1px solid transparent;
      border-radius: var(--border-radius);
      cursor: pointer;
      transition: var(--transition);
      text-decoration: none;
      white-space: nowrap;
      user-select: none;
    }

    .btn:active {
      transform: translateY(1px);
    }

    .btn--primary {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: var(--white);
    }

    .btn--primary:hover {
      background: var(--dark-blue);
      border-color: var(--dark-blue);
      color: var(--dark-blue);
    }

    .btn--primary:focus {
      outline: none;
      background: var(--dark-blue);
      border-color: var(--dark-blue);
      color: var(--white);
      box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.2);
    }

    .btn--secondary {
      background: var(--white);
      color: var(--gray-700);
      border-color: var(--border-color);
    }

    .btn--secondary:hover {
      background: var(--gray-50);
      border-color: var(--gray-300);
      color: var(--gray-800);
    }

    .btn--secondary:focus {
      outline: none;
      background: var(--gray-50);
      border-color: var(--accent-color);
      color: var(--gray-800);
      box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
    }

    .btn--danger {
      background: var(--danger-color);
      color: var(--white);
      border-color: var(--danger-color);
    }

    .btn--danger:hover {
      background: #c53030;
      border-color: #c53030;
      color: var(--white);
    }

    .btn--danger:focus {
      outline: none;
      background: #c53030;
      border-color: #c53030;
      color: var(--white);
      box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.2);
    }

    .btn--sm {
      padding: 0.5rem 0.75rem;
      font-size: 0.75rem;
    }

    /* Full width transactions card */
    .transactions-card {
      grid-column: 1 / -1;
    }

    /* Table */
    .table-container {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .data-table th {
      background: var(--gray-50);
      border-bottom: 1px solid var(--border-color);
      padding: 0.875rem 1rem;
      text-align: right;
      font-weight: 600;
      color: var(--gray-700);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .data-table td {
      padding: 1rem;
      border-bottom: 1px solid var(--gray-100);
      text-align: right;
      vertical-align: middle;
    }

    .data-table tr:hover {
      background: var(--gray-50);
    }

    .row--income {
      background: rgba(56, 161, 105, 0.03);
    }

    .row--expense {
      background: rgba(229, 62, 62, 0.03);
    }

    .amount--income {
      color: var(--success-color);
      font-weight: 600;
    }

    .amount--expense {
      color: var(--danger-color);
      font-weight: 600;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .badge--income {
      background: rgba(56, 161, 105, 0.1);
      color: var(--success-color);
    }

    .badge--expense {
      background: rgba(229, 62, 62, 0.1);
      color: var(--danger-color);
    }

    .actions-col {
      width: 100px;
      text-align: center;
    }

    .cell--actions {
      text-align: center;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: var(--gray-500);
    }

    .empty-icon {
      margin-bottom: 1.5rem;
      color: var(--gray-300);
    }

    .empty-state h4 {
      font-size: 1.125rem;
      color: var(--gray-700);
      margin-bottom: 0.5rem;
    }

    .empty-state p {
      margin: 0;
      max-width: 400px;
      margin-left: auto;
      margin-right: auto;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .notifications-container {
        right: 0.5rem;
        left: 0.5rem;
        top: 0.5rem;
        max-width: none;
      }

      .notification-content {
        padding: 0.75rem;
      }

      .notification-message {
        font-size: 0.8125rem;
      }

      .container {
        padding: 0 1rem;
      }

      .header-content {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }

      .brand {
        flex-direction: column;
        text-align: center;
      }

      .stats-row {
        grid-template-columns: 1fr;
      }

      .content-grid {
        grid-template-columns: 1fr;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .card-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .card-actions {
        justify-content: center;
      }

      .data-table {
        font-size: 0.75rem;
      }

      .data-table th,
      .data-table td {
        padding: 0.5rem;
      }

      .btn {
        font-size: 0.75rem;
        padding: 0.625rem 1rem;
      }
    }

    @media (max-width: 480px) {
      .brand-text h1 {
        font-size: 1.25rem;
      }
      
      .page-header h2 {
        font-size: 1.5rem;
      }
      
      .stat-card__value {
        font-size: 1.5rem;
      }
    }
  `]
})
export class BookkeepingComponent implements OnInit {
  transactions: Transaction[] = [];
  newTransaction: Transaction = {
    date: '',
    description: '',
    amount: 0,
    type: 'income',
    category: '',
    client: ''
  };
  editingTransaction: Transaction | null = null;
  isLoading: boolean = false;
  isDragOver: boolean = false;
  fileName: string = '';
  uploadMessage: string = '';
  
  // מערכת הודעות
  notifications: Array<{id: string, message: string, type: 'success' | 'error' | 'info', visible: boolean}> = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadSavedData();
  }

  // מערכת הודעות
  showNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    const notification = { id, message, type, visible: true };
    
    this.notifications.push(notification);
    
    // הסרת ההודעה אחרי 4 שניות
    setTimeout(() => {
      this.removeNotification(id);
    }, 4000);
  }

  removeNotification(id: string) {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index > -1) {
      this.notifications[index].visible = false;
      setTimeout(() => {
        this.notifications = this.notifications.filter(n => n.id !== id);
      }, 300); // זמן לאנימציה
    }
  }

  // פונקציות לטיפול בגרירה והשמטה
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      this.processFile(file);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.processFile(file);
  }

  private processFile(file: File) {

    this.isLoading = true;
    this.uploadMessage = 'מעבד קובץ...';
    this.fileName = file.name;

    const fileExtension = file.name.toLowerCase().split('.').pop();
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result;
      
      try {
        switch (fileExtension) {
          case 'csv':
            this.parseCSV(content as string);
            break;
          case 'xlsx':
          case 'xls':
            this.parseExcel(content as ArrayBuffer);
            break;
          case 'json':
            this.parseJSON(content as string);
            break;
          default:
            this.uploadMessage = 'סוג קובץ לא נתמך. אנא בחר קובץ CSV, Excel או JSON';
            this.isLoading = false;
            return;
        }
        this.uploadMessage = `הקובץ ${file.name} נטען בהצלחה!`;
      } catch (error) {
        console.error('שגיאה בקריאת הקובץ:', error);
        this.uploadMessage = 'שגיאה בקריאת הקובץ';
      } finally {
        this.isLoading = false;
      }
    };

    reader.onerror = () => {
      this.uploadMessage = 'שגיאה בקריאת הקובץ';
      this.isLoading = false;
    };

    // קריאת הקובץ לפי הסוג
    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file, 'UTF-8');
    }
  }

  parseCSV(csvContent: string) {
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length < 1) {
      this.showNotification('הקובץ ריק או לא תקין', 'error');
      return;
    }

    let addedCount = 0;
    let headerRowsSkipped = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // דילוג על שורות ריקות
      
      const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, '')); // הסרת גם גרשיים וגם גרש יחיד
      
      if (values.length >= 3) { // לפחות 3 עמודות
        
        // דילוג על שורת כותרות
        if (this.isHeaderRow(values)) {
          headerRowsSkipped++;
          continue;
        }
        
        // בדיקה שיש תוכן משמעותי בשורה
        const meaningfulCells = values.filter(v => v && v.length > 0).length;
        if (meaningfulCells < 2) continue; // צריך לפחות 2 תאים עם תוכן
        
        const transaction = this.quickParseRow(values);
        
        if (transaction && transaction.amount > 0 && !this.isDuplicate(transaction)) {
          this.transactions.push(transaction);
          addedCount++;
        }
      }
    }
    
    this.saveData();
    let message = `נוספו ${addedCount} עסקאות חדשות מקובץ CSV`;
    this.showNotification(message, 'success');
  }

  addTransaction() {
    if (this.newTransaction.date && this.newTransaction.description && 
        this.newTransaction.amount && this.newTransaction.client) {
      
      const transaction = {
        ...this.newTransaction,
        id: this.generateId()
      };
      
      if (!this.isDuplicate(transaction)) {
        this.transactions.push(transaction);
        this.resetForm();
        this.saveData();
        this.showNotification('העסקה נוספה בהצלחה!', 'success');
      } else {
        this.showNotification('עסקה זהה כבר קיימת במערכת', 'error');
      }
    } else {
      this.showNotification('אנא מלא את כל השדות הנדרשים', 'error');
    }
  }

  // פונקציה לזיהוי שורת כותרות
  isHeaderRow(values: any[]): boolean {
    if (!values || values.length === 0) return false;
    
    // מילות מפתח נפוצות בכותרות בעברית ובאנגלית
    const headerKeywords = [
      'תאריך', 'date', 'תיאור', 'description', 'סכום', 'amount', 'סוג', 'type',
      'קטגוריה', 'category', 'הכנסה', 'income', 'הוצאה', 'expense',
      'עסקה', 'transaction', 'יתרה', 'balance', 'חשבון', 'account',
      'פרטים', 'details', 'הערות', 'notes', 'שם', 'name', 'לקוח', 'client',
      'ספק', 'supplier', 'מספר', 'number', 'id', 'זהות', 'קוד', 'code',
      'מטבע', 'currency', 'שח', 'nis', 'דולר', 'dollar', 'יורו', 'euro'
    ];
    
    let keywordMatches = 0;
    let numericCells = 0;
    let dateCells = 0;
    let totalValidCells = 0;
    
    // בדיקת כל התאים
    for (let i = 0; i < values.length && i < 10; i++) { // מגביל ל-10 תאים ראשונים
      const cellValue = values[i];
      
      if (!cellValue || cellValue.toString().trim() === '') continue;
      
      totalValidCells++;
      const cellStr = cellValue.toString().toLowerCase().trim();
      
      // בדיקת מילות מפתח
      if (headerKeywords.some(keyword => cellStr.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(cellStr))) {
        keywordMatches++;
        continue;
      }
      
      // בדיקה אם זה מספר (סכום)
      if (this.quickIsAmount(cellStr)) {
        numericCells++;
        continue;
      }
      
      // בדיקה אם זה תאריך
      if (this.quickIsDate(cellStr)) {
        dateCells++;
        continue;
      }
    }
    
    // אם אין תאים תקינים, לא שורת כותרות
    if (totalValidCells === 0) return false;
    
    // חוקי זיהוי משופרים:
    
    // 1. אם יש 2 או יותר מילות מפתח - זו כנראה שורת כותרות
    if (keywordMatches >= 2) return true;
    
    // 2. אם יש מילת מפתח אחת ואין מספרים או תאריכים - זו כנראה שורת כותרות
    if (keywordMatches >= 1 && numericCells === 0 && dateCells === 0) return true;
    
    // 3. אם יש יותר מ-50% מילות מפתח מכלל התאים התקינים
    if (keywordMatches > totalValidCells * 0.5) return true;
    
    // 4. אם כל התאים הם טקסט (לא מספרים ולא תאריכים) ויש לפחות 3 תאים
    if (totalValidCells >= 3 && numericCells === 0 && dateCells === 0 && keywordMatches === 0) {
      // בדיקה נוספת - אם כל התאים הם מילים קצרות (עד 15 תווים) זו כנראה שורת כותרות
      const allShortText = values.every(cell => {
        if (!cell) return true;
        const str = cell.toString().trim();
        return str.length <= 15 && !str.includes(',') && !str.includes(';');
      });
      if (allShortText) return true;
    }
    
    // 5. זיהוי דפוסים נפוצים של כותרות
    const commonPatterns = [
      /^(תאריך|date).*$/i,
      /^(סכום|amount|מחיר|price).*$/i,
      /^(תיאור|description|פרטים|details).*$/i,
      /^(לקוח|client|customer|ספק|supplier).*$/i,
      /^(סוג|type|קטגוריה|category).*$/i
    ];
    
    let patternMatches = 0;
    for (const value of values) {
      if (!value) continue;
      const str = value.toString().trim();
      if (commonPatterns.some(pattern => pattern.test(str))) {
        patternMatches++;
      }
    }
    
    // אם יש 2 או יותר דפוסי כותרות נפוצים
    if (patternMatches >= 2) return true;
    
    return false;
  }

  // פונקציה לבדיקת תקינות תאריך
  isValidDate(value: any): boolean {
    if (!value) return false;
    
    // נסיון ליצור תאריך חדש
    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  isDuplicate(newTransaction: Transaction): boolean {
    return this.transactions.some(t => 
      t.date === newTransaction.date &&
      t.description === newTransaction.description &&
      t.amount === newTransaction.amount &&
      t.client === newTransaction.client
    );
  }

  generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  deleteTransaction(index: number) {
    if (confirm('האם אתה בטוח שברצונך למחוק עסקה זו?')) {
      this.transactions.splice(index, 1);
      this.saveData();
    }
  }

  getTotalIncome(): number {
    return this.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  getTotalExpenses(): number {
    return this.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  getNetProfit(): number {
    return this.getTotalIncome() - this.getTotalExpenses();
  }

  exportToExcel() {
    if (this.transactions.length === 0) {
      this.showNotification('אין עסקאות לייצוא', 'error');
      return;
    }

    // יצירת מחברת עבודה
    const workbook = XLSX.utils.book_new();
    
    // הכנת הנתונים
    const excelData = [
      ['תאריך', 'תיאור', 'סכום', 'סוג', 'לקוח'], // כותרות
      ...this.transactions.map(t => [
        t.date,
        t.description,
        t.amount,
        t.type === 'income' ? 'הכנסה' : 'הוצאה',
        t.client
      ])
    ];
    
    // יצירת דף עבודה
    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    
    // הגדרת רוחב עמודות
    const columnWidths = [
      { width: 12 }, // תאריך
      { width: 30 }, // תיאור
      { width: 15 }, // סכום
      { width: 10 }, // סוג
      { width: 20 }  // לקוח
    ];
    worksheet['!cols'] = columnWidths;
    
    // הוספת הדף למחברת
    XLSX.utils.book_append_sheet(workbook, worksheet, 'עסקאות');
    
    // ייצוא הקובץ
    const fileName = `transactions_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    this.showNotification(`הקובץ ${fileName} יוצא בהצלחה!`, 'success');
  }

  clearAllData() {
    if (confirm('האם אתה בטוח שברצונך למחוק את כל הנתונים?\nפעולה זו אינה ניתנת לביטול.')) {
      this.transactions = [];
      this.saveData();
      this.showNotification('כל הנתונים נמחקו בהצלחה', 'success');
    }
  }

  private saveData() {
    localStorage.setItem('bookkeeping_transactions', JSON.stringify(this.transactions));
  }

  private loadSavedData() {
    const saved = localStorage.getItem('bookkeeping_transactions');
    if (saved) {
      try {
        this.transactions = JSON.parse(saved);
      } catch (error) {
        console.error('שגיאה בטעינת נתונים:', error);
      }
    }
  }

  private resetForm() {
    this.newTransaction = {
      date: '',
      description: '',
      amount: 0,
      type: 'income',
      category: '',
      client: ''
    };
  }

  // פונקציה לפירוק קבצי Excel
  parseExcel(arrayBuffer: ArrayBuffer) {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length < 1) {
      this.showNotification('הגיליון ריק או לא תקין', 'error');
      return;
    }

    let addedCount = 0;
    let headerRowsSkipped = 0;
    
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i] as any[];
      if (!row || row.length === 0) continue; // דילוג על שורות ריקות
      
      // בדיקה שיש תוכן משמעותי בשורה
      const meaningfulCells = row.filter(cell => cell !== null && cell !== undefined && cell !== '').length;
      if (meaningfulCells < 2) continue;
      
      if (row.length >= 3) { // לפחות 3 עמודות
        
        // דילוג על שורת כותרות
        if (this.isHeaderRow(row)) {
          headerRowsSkipped++;
          continue;
        }
        
        const transaction = this.quickParseRow(row);
        
        if (transaction && transaction.amount > 0 && !this.isDuplicate(transaction)) {
          this.transactions.push(transaction);
          addedCount++;
        }
      }
    }
    
    this.saveData();
    let message = `נוספו ${addedCount} עסקאות חדשות מקובץ Excel`;
    if (headerRowsSkipped > 0) {
      message += ` (דולגו ${headerRowsSkipped} שורות כותרות)`;
    }
    this.showNotification(message, 'success');
  }

  // פונקציה לפירוק קבצי JSON
  parseJSON(jsonContent: string) {
    try {
      const data = JSON.parse(jsonContent);
      let addedCount = 0;
      
      const items = Array.isArray(data) ? data : [data];
      
      items.forEach((item: any) => {
        if (item && typeof item === 'object') {
          const transaction = this.quickParseObject(item);
          
          if (transaction && !this.isDuplicate(transaction)) {
            this.transactions.push(transaction);
            addedCount++;
          }
        }
      });
      
      this.saveData();
      this.showNotification(`נוספו ${addedCount} עסקאות חדשות מקובץ JSON`, 'success');
    } catch (error) {
      this.showNotification('שגיאה בקריאת קובץ JSON', 'error');
    }
  }

  // פונקציה לבדיקת תקינות עסקה - פשוטה ומהירה
  private isValidTransaction(item: any): boolean {
    return item && typeof item === 'object';
  }

  // פונקציה מהירה לנורמליזציה של סוג העסקה
  private normalizeType(type: any): 'income' | 'expense' {
    if (!type) return 'income';
    const typeStr = type.toString().toLowerCase();
    
    // בדיקה מהירה עם includes
    if (typeStr.includes('expense') || typeStr.includes('הוצאה') || 
        typeStr.includes('out') || typeStr === 'expense') {
      return 'expense';
    }
    
    return 'income';
  }

  // פונקציה מהירה לעיצוב תאריך
  private formatDate(dateValue: any): string {
    if (!dateValue) return new Date().toISOString().split('T')[0];
    
    // אם זה כבר מחרוזת תאריך תקינה
    if (typeof dateValue === 'string' && /\d{4}-\d{2}-\d{2}/.test(dateValue)) {
      return dateValue;
    }
    
    // אם זה מספר Excel
    if (typeof dateValue === 'number') {
      try {
        const date = XLSX.SSF.parse_date_code(dateValue);
        if (date) {
          return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
        }
      } catch (error) {
        return new Date().toISOString().split('T')[0];
      }
    }
    
    // ברירת מחדל
    return dateValue.toString();
  }

  // פונקציות עזר מהירות לזיהוי נתונים
  private quickParseRow(values: any[]): Transaction | null {
    let date = '';
    let description = 'תיאור';
    let amount = 0;
    let type: 'income' | 'expense' = 'income';
    let client = 'לקוח';

    // חיפוש מהיר לפי תבניות פשוטות
    for (let i = 0; i < values.length && i < 6; i++) {
      const value = values[i];
      if (!value) continue;

      const str = value.toString().trim();
      
      // זיהוי תאריך (פשוט)
      if (!date && this.quickIsDate(str)) {
        date = this.quickFormatDate(str);
        continue;
      }
      
      // זיהוי סכום (פשוט)
      if (!amount && this.quickIsAmount(str)) {
        amount = this.quickParseAmount(str);
        continue;
      }
      
      // זיהוי סוג (פשוט)
      if (this.quickIsType(str)) {
        type = this.quickParseType(str);
        continue;
      }
      
      // שאר הטקסטים - תיאור או לקוח
      if (str.length > 1) {
        if (description === 'תיאור') {
          description = str;
        } else if (client === 'לקוח') {
          client = str;
        }
      }
    }

    // ברירת מחדל אם לא נמצא תאריך
    if (!date) {
      date = new Date().toISOString().split('T')[0];
    }

    return {
      date,
      description,
      amount,
      type,
      category: '',
      client,
      id: this.generateId()
    };
  }

  private quickParseObject(item: any): Transaction | null {
    return {
      date: this.findByKeys(item, ['date', 'תאריך', 'Date']) || new Date().toISOString().split('T')[0],
      description: this.findByKeys(item, ['description', 'תיאור', 'desc']) || 'תיאור',
      amount: this.quickParseAmount(this.findByKeys(item, ['amount', 'סכום', 'sum']) || 0),
      type: this.quickParseType(this.findByKeys(item, ['type', 'סוג', 'kind']) || 'income'),
      category: '',
      client: this.findByKeys(item, ['client', 'לקוח', 'customer']) || 'לקוח',
      id: this.generateId()
    };
  }

  // פונקציות עזר מהירות
  private quickIsDate(str: string): boolean {
    return /\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/.test(str) || 
           /\d{1,2}[-\/]\d{1,2}[-\/]\d{4}/.test(str);
  }

  private quickIsAmount(str: string): boolean {
    if (!str || typeof str !== 'string') return false;
    
    // הסרת רווחים וסימני מטבע
    const clean = str.replace(/[,₪$€\s]/g, '');
    
    // בדיקה שזה מספר חיובי
    const isNumber = /^\d+\.?\d*$/.test(clean);
    if (!isNumber) return false;
    
    const num = parseFloat(clean);
    
    // חייב להיות מספר תקין וחיובי ולא אפס
    return !isNaN(num) && num > 0 && num < 999999999; // מגביל סכומים סבירים
  }

  private quickIsType(str: string): boolean {
    const lower = str.toLowerCase();
    return ['income', 'expense', 'הכנסה', 'הוצאה', 'in', 'out'].some(t => lower.includes(t));
  }

  private quickFormatDate(str: string): string {
    // פורמט פשוט - אם זה נראה כמו תאריך, נשתמש בו
    if (/\d{4}-\d{1,2}-\d{1,2}/.test(str)) {
      return str;
    }
    
    // המרה פשוטה של dd/mm/yyyy ל-yyyy-mm-dd
    const parts = str.split(/[-\/]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      } else {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    
    return str;
  }

  private quickParseAmount(value: any): number {
    if (typeof value === 'number') return Math.abs(value);
    
    const str = value.toString().replace(/[,₪$€\s]/g, '');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : Math.abs(num);
  }

  private quickParseType(value: any): 'income' | 'expense' {
    const str = value.toString().toLowerCase();
    return ['expense', 'הוצאה', 'out', '-'].some(t => str.includes(t)) ? 'expense' : 'income';
  }

  private findByKeys(obj: any, keys: string[]): any {
    for (const key of keys) {
      if (obj.hasOwnProperty(key)) {
        return obj[key];
      }
      // חיפוש case-insensitive
      const found = Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase());
      if (found) {
        return obj[found];
      }
    }
    return null;
  }
}
