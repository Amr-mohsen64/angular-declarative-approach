import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Supplier } from '../../suppliers/supplier';
import { Product } from '../product';

import { ProductService } from '../product.service';
import { EMPTY, Subject, catchError, combineLatest, filter, map } from 'rxjs';

@Component({
  selector: 'pm-product-detail',
  templateUrl: './product-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailComponent {
  errorMessageSubject = new Subject();
  errorMessage$ = this.errorMessageSubject.asObservable();

  product$ = this.productService.selectedProduct$.pipe(
    catchError((error) => {
      this.errorMessageSubject.next(error);
      return EMPTY;
    })
  );

  pageTitle$ = this.product$.pipe(
    map((product) =>
      product ? 'product detail for' + product.productName : null
    )
  );

  productSuppliers$ = this.productService.selectedProductSuppliers$.pipe(
    catchError((error) => {
      this.errorMessageSubject.next(error);
      return EMPTY;
    })
  );

  vm$ = combineLatest([
    this.product$,
    this.productSuppliers$,
    this.pageTitle$,
  ]).pipe(
    filter(([product]) => Boolean(product)), // filter out any empty product
    map(([product, productSuppliers, pageTitle]) => {
      return { product, productSuppliers, pageTitle };
    })
  );

  constructor(private productService: ProductService) {}
}
