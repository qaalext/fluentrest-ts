import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import {logError, LogLevel, logRequest, logResponse} from "./logger"
import {RestAssuredDefaults} from "./config"


export class RestAssuredCore{
    private method: string = '';
    private endpoint: string = '';
    protected response?: AxiosResponse;
    protected config: AxiosRequestConfig = {};
    protected logToFile: boolean = false;
    protected logLevel: LogLevel = 'info';



    constructor() {
        this.config.timeout = RestAssuredDefaults.timeout;
        this.logLevel = RestAssuredDefaults.logLevel;
        this.config.baseURL = RestAssuredDefaults.baseUrl;
      }

    setLogLevel(level: LogLevel) {
        this.logLevel = level;
        return this;
      }
         
    private async sendRequest(method: string, endpoint: string) : Promise<this> {
        this.method = method.toUpperCase();
        this.endpoint = endpoint;
    
        logRequest(method, endpoint, this.config, this.logLevel, this.logToFile);
    
        try {
          switch (method.toLowerCase()) {
            case 'get':
              this.response = await axios.get(endpoint, this.config);
              break;
            case 'post':
              this.response = await axios.post(endpoint, this.config.data, this.config);
              break;
            case 'put':
              this.response = await axios.put(endpoint, this.config.data, this.config);
              break;
            case 'patch':
              this.response = await axios.patch(endpoint, this.config.data, this.config);
              break;
            case 'delete':
              this.response = await axios.delete(endpoint, this.config);
              break;
            case 'head':
              this.response = await axios.head(endpoint, this.config);
              break;
            case 'options':
              this.response = await axios.options(endpoint, this.config);
              break;
            default:
              throw new Error(`Unsupported HTTP method: ${method}`);
          }

          logResponse(this.response, this.logLevel, this.logToFile);
        } catch (error: any) {
          logError(error, 'Request Failure', this.logLevel, this.logToFile, error?.response?.data);
          throw error;
        }
    
        return this;
      }
    
      async whenGet(endpoint: string): Promise<this> {
        return this.sendRequest('get', endpoint);
      }
    
      async whenPost(endpoint: string): Promise<this> {
        return this.sendRequest('post', endpoint);
      }
    
      async whenPut(endpoint: string): Promise<this> {
        return this.sendRequest('put', endpoint);
      }
    
      async whenPatch(endpoint: string): Promise<this> {
        return this.sendRequest('patch', endpoint);
      }
    
      async whenDelete(endpoint: string): Promise<this> {
        return this.sendRequest('delete', endpoint);
      }
    
      async whenHead(endpoint: string): Promise<this> {
        return this.sendRequest('head', endpoint);
      }
    
      async whenOptions(endpoint: string): Promise<this> {
        return this.sendRequest('options', endpoint);
      }



}