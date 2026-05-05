import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { FiMail, FiLock, FiActivity, FiEye, FiEyeOff } from "react-icons/fi";
import { AuthContext } from "../../context/AuthContext";
import { useAuth } from "../../context/AuthContext";

const LoginPage = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    const result = await login(data);
    if (result.success) {
      navigate(`/${result.role}/dashboard`, { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex font-sans">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border-r border-slate-800 p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3 z-10">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-blue-500 rounded-xl flex items-center justify-center">
            <FiActivity className="text-white text-xl" />
          </div>
          <span className="font-display font-bold text-white text-2xl">
            Medi<span className="text-teal-400">Flow</span>
          </span>
        </div>

        {/* Hero Text */}
        <div className="relative z-10 space-y-6">
          <h2 className="font-display font-bold text-white text-4xl leading-tight">
            Healthcare,
            <br />
            <span className="bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent">
              reimagined.
            </span>
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            Book appointments, check symptoms with AI, and manage your health records — all in one place.
          </p>

          {/* Feature List */}
          <div className="space-y-3">
            {["AI-powered symptom checker", "Verified specialist doctors", "Secure medical records"].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 bg-teal-500/20 border border-teal-500/40 rounded-full flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 bg-teal-400 rounded-full" />
                </div>
                <span className="text-slate-300 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="relative z-10 flex gap-8">
          {[["10K+", "Patients"], ["500+", "Doctors"], ["50K+", "Appointments"]].map(([num, label]) => (
            <div key={label}>
              <p className="text-white font-display font-bold text-xl">{num}</p>
              <p className="text-slate-500 text-xs">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile Logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-blue-500 rounded-xl flex items-center justify-center">
              <FiActivity className="text-white" />
            </div>
            <span className="font-display font-bold text-white text-xl">
              Medi<span className="text-teal-400">Flow</span>
            </span>
          </div>

          <h1 className="font-display font-bold text-white text-3xl mb-2">Welcome back</h1>
          <p className="text-slate-400 mb-8">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-base" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  {...register("email", {
                    required: "Email is required",
                    pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email format" },
                  })}
                  className={`w-full bg-slate-800 border rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 text-sm outline-none focus:ring-2 focus:ring-teal-500/50 transition-all
                    ${errors.email ? "border-red-500/60" : "border-slate-700 focus:border-teal-500/50"}`}
                />
              </div>
              {errors.email && <p className="text-red-400 text-xs">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-base" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password", { required: "Password is required", minLength: { value: 6, message: "Min 6 characters" } })}
                  className={`w-full bg-slate-800 border rounded-xl pl-10 pr-12 py-3 text-white placeholder-slate-500 text-sm outline-none focus:ring-2 focus:ring-teal-500/50 transition-all
                    ${errors.password ? "border-red-500/60" : "border-slate-700 focus:border-teal-500/50"}`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs">{errors.password.message}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-400 hover:to-blue-400 text-white rounded-xl py-3 font-semibold text-sm transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Sign In
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-teal-400 hover:text-teal-300 font-medium transition-colors">
              Create one
            </Link>
          </p>

          {/* Demo Credentials */}
          <div className="mt-8 p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl">
            <p className="text-slate-400 text-xs font-medium mb-2">Demo credentials:</p>
            <div className="space-y-1 text-xs text-slate-500">
              <p>Patient: patient@demo.com / demo123</p>
              <p>Doctor: doctor@demo.com / demo123</p>
              <p>Admin: admin@demo.com / demo123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;