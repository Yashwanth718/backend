class ApiResponse{
  constructor(statusCode,message="Success",data){
    this.statusCode = statusCode
    this.message = message
    this.data = data
    this.success = statusCode < 400 //(Less than 400(response status codes))
  }
}

export {ApiResponse}