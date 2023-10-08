import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';

import {
  EMPTY,
  Observable,
  Subscription,
  catchError,
  of,
  switchMap,
} from 'rxjs';
import { ProductCategory } from '../product-categories/product-category';

import { Product } from './product';
import { ProductService } from './product.service';

@Component({
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductListComponent {
  pageTitle = 'Product List';
  errorMessage$ = new Observable();
  categories: ProductCategory[] = [];
  products$ = this.productService.products$.pipe(
    catchError((error) => {
      switchMap(() =>  this.errorMessage$ );
      return EMPTY;
    })
  );

  constructor(private productService: ProductService) {}

  onAdd(): void {
    console.log('Not yet implemented');
  }

  onSelected(categoryId: string): void {
    console.log('Not yet implemented');
  }
}
