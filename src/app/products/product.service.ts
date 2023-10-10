import { SupplierService } from './../suppliers/supplier.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ProductCategoryService } from './../product-categories/product-category.service';

import {
  BehaviorSubject,
  catchError,
  combineLatest,
  filter,
  forkJoin,
  map,
  merge,
  Observable,
  of,
  scan,
  shareReplay,
  Subject,
  switchMap,
  tap,
  throwError,
} from 'rxjs';

import { Product } from './product';
import { Supplier } from '../suppliers/supplier';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private productsUrl = 'api/products';
  private suppliersUrl = 'api/suppliers';

  products$ = this.http.get<Product[]>(this.productsUrl).pipe(
    tap((data) => console.log('Products: ', JSON.stringify(data))),
    catchError(this.handleError)
  );

  productsWithCategory$ = combineLatest([
    this.products$,
    this.productCategoryService.productsCategories$,
  ]).pipe(
    map(([products, categories]) =>
      products.map(
        (product) =>
          ({
            ...product,
            price: product.price ? product.price * 1.5 : 0,
            searchKey: [product.productName],
            category: categories.find(
              (category) => category.id === product.categoryId
            )?.name,
          } as Product)
      )
    ),
    shareReplay(1)
  );

  private productSelectedIdSubject = new BehaviorSubject<number>(0);
  productSelectedIdAction$ = this.productSelectedIdSubject.asObservable();

  selectedProduct$ = combineLatest([
    this.productsWithCategory$,
    this.productSelectedIdAction$,
  ]).pipe(
    map(([products, selectedProductId]) =>
      products.find((product) => product.id === selectedProductId)
    )
  );

  productInsertSubject = new Subject<Product>();
  productInsertAction$ = this.productInsertSubject.asObservable();

  productsWithAdd$ = merge(
    this.productsWithCategory$,
    this.productInsertAction$
  ).pipe(
    //if type of emitted value from merge is array then copy it ,else type is add product so copy old products and push new product
    scan(
      (acc, value) => (value instanceof Array ? [...value] : [...acc, value]),
      [] as Product[]
    )
  );

  //get all approach
  // selectedProductSuppliers$ = combineLatest([
  //   this.selectedProduct$,
  //   this.supplierService.suppliers$,
  // ]).pipe(
  //   map(([selectedProduct, suppliers]) =>
  //     suppliers.filter((supplier) =>
  //       selectedProduct?.supplierIds?.includes(supplier.id)
  //     )
  //   )
  // );

  //just in time approach
  selectedProductSuppliers$ = this.selectedProduct$.pipe(
    filter((product) => Boolean(product)), // we don't attempt to get suppliers if theres no selected product
    switchMap((selectedProduct) => {
      if (selectedProduct?.supplierIds) {
        // takes array of obs and returns array if their emissions
        return forkJoin(
          //waits for http to complete before the fork join emits
          selectedProduct?.supplierIds?.map((supplierId) =>
            this.http.get<Supplier>(this.suppliersUrl + `/${supplierId}`)
          )
        );
      } else return of([]);
    }),
    tap((suppliers) => console.log('suppliers =>' + suppliers))
  );

  constructor(
    private http: HttpClient,
    private productCategoryService: ProductCategoryService,
    private supplierService: SupplierService
  ) {}

  selectedProductChanged(selectedProductId: number) {
    this.productSelectedIdSubject.next(selectedProductId);
  }

  addProduct() {
    this.productInsertSubject.next(this.fakeProduct());
  }

  private fakeProduct(): Product {
    return {
      id: 42,
      productName: 'Another One',
      productCode: 'TBX-0042',
      description: 'Our new product',
      price: 8.9,
      categoryId: 3,
      category: 'Toolbox',
      quantityInStock: 30,
    };
  }

  private handleError(err: HttpErrorResponse): Observable<never> {
    // in a real world app, we may send the server to some remote logging infrastructure
    // instead of just logging it to the console
    let errorMessage: string;
    if (err.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      errorMessage = `An error occurred: ${err.error.message}`;
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      errorMessage = `Backend returned code ${err.status}: ${err.message}`;
    }
    console.error(err);
    return throwError(() => errorMessage);
  }
}
