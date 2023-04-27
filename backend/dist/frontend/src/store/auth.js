"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuthStore = void 0;
const pinia_1 = require("pinia");
const index_1 = require("../api/index");
exports.useAuthStore = (0, pinia_1.defineStore)('auth', {
    state: () => {
        /* Initialize state from local storage to enable user to stay logged in */
        const userData = localStorage.getItem('user');
        return {
            user: userData ? JSON.parse(userData) : null,
            token: localStorage.getItem('token'),
        };
    },
    actions: {
        login(form) {
            return __awaiter(this, void 0, void 0, function* () {
                const data = yield (0, index_1.login)(form);
                this.user = data.user;
                this.token = data.token;
                /* Store user in local storage to keep them logged in between page refreshes */
                localStorage.setItem('user', JSON.stringify(this.user));
                localStorage.setItem('token', this.token);
            });
        },
        signup(form) {
            return __awaiter(this, void 0, void 0, function* () {
                const data = yield (0, index_1.signup)(form);
                this.user = data.user;
                this.token = data.token;
                /* Store user in local storage to keep them logged in between page refreshes */
                localStorage.setItem('user', JSON.stringify(this.user));
                localStorage.setItem('token', this.token);
            });
        },
        logout() {
            this.user = null;
            this.token = null;
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        },
        refresh(token) {
            this.token = token;
        }
    }
});
