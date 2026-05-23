import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utility/catchAsync";
import sendResponse from "../../utility/sendResponse";
import { authService } from "./auth.service";

const signup = catchAsync(async (req: Request, res: Response) => {
  try{
      const result = await authService.signupIntoDB(req.body);

  res.status(200).json({
    success: true,
    message: "User registered successfully",
    data: result,
  });
  }catch(error : any){
    res.status(500).json({
      success: false,
      message: "Failed to register user",
      data: error.message,
    });
  }
});

const login = catchAsync(async (req: Request, res: Response) => {
  try{
    const result = await authService.loginFromDB(req.body);
    
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch(error : any){
    res.status(500).json({
      success: false,
      message: "Failed to login",
      data: error.message,
    });
  }
});

export const authController = {
  signup,
  login,
};
