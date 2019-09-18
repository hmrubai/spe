import { Component, OnInit } from "@angular/core";
import { Observable } from "rxjs";
import {
  debounceTime,
  distinctUntilChanged,
  tap,
  switchMap,
  map,
  catchError
} from "rxjs/operators";
import { SaleService } from "../services/sale.service";
import * as $ from "jquery";
import Swal from "sweetalert2";

@Component({
  selector: "app-sale",
  templateUrl: "./sale.component.html",
  styleUrls: ["./sale.component.css"]
})
export class SaleComponent implements OnInit {
  cartItem: any = {
    medicine: "",
    medicine_id: "",
    quantity: "",
    batch_no: "",
    token: "",
    unit_type: "PCS"
  };
  isAntibiotic = false;
  order: any = {
    token: '',
    sub_total: '',
    tendered: '',
    change: 0,
    total_due_amount: 0,
    total_advance_amount: 0,
    total_payble_amount: 0,
    discount: 0,
    payment_type: 'cash',
    customer_name: '',
    customer_mobile: '',
    prescription_image: '',
    sendsms: false,
  };
  searchData: any[] = [];
  loader_sub: boolean;
  medicineSearch: any = {
    search: ""
  };
  batchSearch = {
    medicine_id: ""
  };
  availableQuantity = {
    medicine_id: ""
  };
  availability: number;
  searchList: any[];
  medicineList = [];
  batchList: any;
  productList: any;
  cartLoad: boolean;
  orderId: string;
  increament: any;
  fileName: any;
  orderDetails: any;
  constructor(private saleService: SaleService) { }

  ngOnInit() {
    const token = localStorage.getItem('token');
    this.cartItem.token = token ? token : '';
    console.log('token');
    if (this.cartItem.token !== '') {
      this.checkToken(this.cartItem.token);
    }
  }
  checkToken(token) {
    this.saleService.checkCart(this.cartItem.token)
      .subscribe(res => {
        if (res.status === true) {
          this.saleService.cartDetails(this.cartItem.token).subscribe((data) => {
            this.productList = data;
            this.fileName = data.file_name;
            // console.log(this.productList.file_name);
            this.isAntibiotic = data.is_antibiotic;
            this.order.sub_total = this.productList ? this.productList.sub_total : 0;
            this.order.total_payble_amount = this.productList ? this.productList.sub_total - this.productList.discount : 0;
          });
        } else {
          localStorage.removeItem('user_cart');
          localStorage.removeItem('token');
          this.productList = [];
        }
      });
  }
  search = (text$: Observable<string>) => {
    return text$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => {
        this.searchData = [];
        this.loader_sub = true;
      }),
      switchMap(term => {
        this.loader_sub = true;
        this.medicineSearch.search = term.trim();

        return this.getMedicineList(this.medicineSearch);
      })
    );
  };
  getMedicineList(params): any {
    if (!params && params === "") {
      this.loader_sub = false;
      return [];
    }

    return this.saleService.searchMedicineByPharmacy(params).pipe(
      map(res => {
        this.medicineList = [];
        this.loader_sub = false;
        this.searchData = res;
        for (let s of res) {
          this.medicineList.push(s.name);
        }
        return this.medicineList;
      }),
      catchError(() => {
        this.loader_sub = false;
        return [];
      })
    );
  }
  reset() {
    localStorage.removeItem('user_cart');
    localStorage.removeItem('token');
    this.productList = [];
    this.order.sub_total = 0;
    this.order.tendered = 0;
    this.order.change = 0;
    this.order.total_due_amount = 0;
    this.order.total_advance_amount = 0;
    this.order.total_payble_amount = 0;
    this.order.discount = 0;
    this.order.payment_type = 'cash';
    this.order.customer_name = '';
    this.order.customer_mobile = '';
  }
  getNet() {
    this.order.total_payble_amount = this.order.sub_total ? this.order.sub_total - this.order.discount : 0;
  }
  getChange() {
    this.order.change = this.checkIsLessZero(this.order.tendered ? this.order.tendered - this.order.total_payble_amount : 0);
    this.order.total_due_amount = this.checkIsLessZero(this.order.tendered ? this.order.total_payble_amount - this.order.tendered : 0);
    if (this.order.total_due_amount == 0) {
      this.order.total_advance_amount = this.order.total_payble_amount;
      $(".tr-change").addClass("tdChange");
      $(".tr-due").removeClass("tdDue");
    } else {
      this.order.total_advance_amount = this.order.tendered;
      $(".tr-due").addClass("tdDue");
      $(".tr-change").removeClass("tdChange");
    }
  }
  checkIsLessZero(value) {
    return value < 0 ? 0 : value;
  }
  addToCart() {
    if (this.cartItem.medicine) {
      const token = localStorage.getItem("token");
      this.cartItem.token = token ? token : "";

      this.saleService
        .addtoCart(this.cartItem)
        .then(res => {
          if (res.success === true) {
            this.saleService.saveCartsInlocalStorage(res.data);
            localStorage.setItem("token", res.data.token);
            this.productList = res.data;
            this.isAntibiotic = res.data.is_antibiotic;
            this.order.sub_total = this.productList ? this.productList.sub_total : 0;
            this.order.total_payble_amount = this.productList ? this.productList.sub_total - this.productList.discount : 0;
            this.cartLoad = false;
            this.batchList = [];
            $("#myForm").trigger("reset");
            this.orderId = "";

            if (this.isAntibiotic) {
              Swal.fire({
                position: "center",
                type: "warning",
                title:
                  "Anti-Biotic Medicine Alart! Please Upload The Prescription Image.",
                showConfirmButton: false,
                timer: 2000
              });
            }
          }
        })
        .catch(err => {
          console.log(err);
          this.cartLoad = false;
          Swal.fire({
            type: "warning",
            title: "Oops...",
            text: "Something went wrong!",
            showConfirmButton: false
          });
        });
    }
  }
  trackList(index, pro) {
    return pro ? pro.id : null;
  }
  getBatch() {
    for (let s of this.searchData) {
      if (s.name == this.cartItem.medicine) {
        this.cartItem.medicine_id = s.id;
      }
    }
    this.batchSearch.medicine_id = this.cartItem.medicine_id;
    this.saleService
      .getBatchList(this.batchSearch)
      .subscribe(data => (this.batchList = data));
  }
  getAvailableQuantity() {
    for (let s of this.searchData) {
      if (s.name == this.cartItem.medicine) {
        this.cartItem.medicine_id = s.id;
      }
    }
    this.availableQuantity.medicine_id = this.cartItem.medicine_id;
    this.saleService
      .getAvailableQuantity(this.availableQuantity)
      .subscribe(data => (this.availability = data.available_quantity));
  }
  decreaseQuant(cart, i) {
    if (cart.quantity > 1) {
      this.increament = i;
      const obj = {
        id: cart.id,
        token: this.productList.token,
        sales_tax: cart.sales_tax,
        increment: 0,
        price: cart.price,
        rental_duration: cart.rental_duration
      };
      this.updateCartQunt(obj);
    }
  }
  removeItem(itemId) {
    this.saleService.deleteCart(itemId, localStorage.getItem('token')).then(
      res => {
        if (res.success === true) {
          // this.alertS.success(this.alertContainer, 'Item successfull deleted', true, 3000);
          this.saleService.saveCartsInlocalStorage(res.data);
          localStorage.setItem('token', res.data.token);

          this.productList = res.data;
          this.isAntibiotic = res.data.is_antibiotic;
          this.order.sub_total = this.productList ? this.productList.sub_total : 0;
          this.order.total_payble_amount = this.productList ? (this.productList.sub_total - this.productList.discount) : 0;
        }
      }
    ).catch(
      err => {
        // this.alertS.error(this.alertContainer, err.error.error, true, 3000);
      }
    );
  }
  increaseQuant(cart, i) {
    this.increament = i;
    const obj = {
      id: cart.id,
      token: this.productList.token,
      increment: 1
    };
    this.updateCartQunt(obj);
  }

  updateCartQunt(data) {
    console.log(data);
    this.saleService
      .updateCart(data)
      .then(res => {
        if (res.success === true) {
          this.productList = res.data;
          this.isAntibiotic = res.data.is_antibiotic;
          this.order.sub_total = this.productList
            ? this.productList.sub_total
            : 0;
          this.order.total_payble_amount = this.productList
            ? this.productList.sub_total - this.productList.discount
            : 0;
          this.saleService.saveCartsInlocalStorage(res.data);
          // $("custom-alert").css("display", "block");
          // this.alertS.success(
          //   this.alertContainer,
          //   "Cart Updated Successfully",
          //   true,
          //   3000
          // );
        } else {
          // $("custom-alert").css("display", "block");
          // this.alertS.error(
          //   this.alertContainer,
          //   "Something wrong !! Please try again ",
          //   true,
          //   3000
          // );
        }
        this.increament = null;
      })
      .catch(err => {
        console.log(err);
        // $("custom-alert").css("display", "block");
        // this.alertS.error(
        //   this.alertContainer,
        //   "Something wrong !! Please try again",
        //   true,
        //   3000
        // );
        this.increament = null;
      });
  }
  submitOrder() {
    if (this.order.tendered) {
      this.order.token = localStorage.getItem('token');
      console.log(this.order);
      this.saleService.makeSaleOrder(this.order).then(
        res => {
          if (res.success === true) {
            this.orderId = res.data.order_id;
            this.orderDetails = res.data;
            this.fileName = '';
            Swal.fire({
              position: "center",
              type: "success",
              title: "Orders successfully submitted.",
              showConfirmButton: false,
              timer: 1500
            });

            this.reset();
          }
        }
      ).catch(
        err => {
          Swal.fire({
            type: "warning",
            title: "Oops...",
            text: "Please enter all required field!",
            showConfirmButton: false,
          });
        }
      );
    } else {
      Swal.fire({
        type: "warning",
        title: "Oops...",
        text: "Please enter the tendered amount!",
        showConfirmButton: false,
      });
    }
  }
}