import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { FiActivity, FiUser, FiMail, FiLock, FiPhone, FiBriefcase } from "react-icons/fi";
import { AuthContext } from "../../context/AuthContext";
import { useAuth } from "../../context/AuthContext";

const RegisterPage = () => {
  const { register: registerUser, loading } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState("patient");

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch("password");

  const onSubmit = async (data) => {
    const result = await registerUser({ ...data, role });
    if (result.success) {
      navigate(`/${result.role}/dashboard`, { replace: true });
    }
  };

  const fieldClass = (hasError) =>
    `w-full bg-slate-800 border rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm outline-none focus:ring-2 focus:ring-teal-500/50 transition-all
    ${hasError ? "border-red-500/60" : "border-slate-700 focus:border-teal-500/50"}`;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-2xl animate-slide-up">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-blue-500 rounded-xl flex items-center justify-center">
            <FiActivity className="text-white text-xl" />
          </div>
          <span className="font-display font-bold text-white text-2xl">
            Medi<span className="text-teal-400">Flow</span>
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
          <h1 className="font-display font-bold text-white text-2xl mb-1 text-center">Create your account</h1>
          <p className="text-slate-400 text-sm text-center mb-8">Join thousands of patients and doctors on MediFlow</p>

          {/* Role Selector */}
          <div className="flex gap-3 mb-8 p-1 bg-slate-800 rounded-xl">
            {["patient", "doctor"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all capitalize
                  ${role === r ? "bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
              >
                {r === "patient" ? "👤 Patient" : "🩺 Doctor"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Common Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Full Name</label>
                <input
                  placeholder="Dr. John Smith"
                  {...register("name", { required: "Name is required", minLength: { value: 2, message: "Min 2 chars" } })}
                  className={fieldClass(errors.name)}
                />
                {errors.name && <p className="text-red-400 text-xs">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  {...register("email", { required: "Email is required", pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email" } })}
                  className={fieldClass(errors.email)}
                />
                {errors.email && <p className="text-red-400 text-xs">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Phone (optional)</label>
                <input placeholder="+91 98765 43210" {...register("phone")} className={fieldClass(false)} />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Gender</label>
                <select {...register("gender")} className={fieldClass(false)}>
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Password</label>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  {...register("password", { required: "Password is required", minLength: { value: 6, message: "Min 6 chars" } })}
                  className={fieldClass(errors.password)}
                />
                {errors.password && <p className="text-red-400 text-xs">{errors.password.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Confirm Password</label>
                <input
                  type="password"
                  placeholder="Repeat password"
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
                    validate: (v) => v === password || "Passwords do not match",
                  })}
                  className={fieldClass(errors.confirmPassword)}
                />
                {errors.confirmPassword && <p className="text-red-400 text-xs">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            {/* Doctor-specific Fields */}
            {role === "doctor" && (
              <div className="border-t border-slate-800 pt-4 mt-4">
                <p className="text-slate-300 text-sm font-semibold mb-4">🩺 Professional Information</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Specialization *</label>
                    <input
                      placeholder="e.g. Cardiologist"
                      {...register("specialization", { required: role === "doctor" && "Required" })}
                      className={fieldClass(errors.specialization)}
                    />
                    {errors.specialization && <p className="text-red-400 text-xs">{errors.specialization.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Qualification *</label>
                    <input
                      placeholder="e.g. MBBS, MD"
                      {...register("qualification", { required: role === "doctor" && "Required" })}
                      className={fieldClass(errors.qualification)}
                    />
                    {errors.qualification && <p className="text-red-400 text-xs">{errors.qualification.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Years of Experience *</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="5"
                      {...register("experience", { required: role === "doctor" && "Required", min: 0 })}
                      className={fieldClass(errors.experience)}
                    />
                    {errors.experience && <p className="text-red-400 text-xs">{errors.experience.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">License Number *</label>
                    <input
                      placeholder="MCI-XXXXX"
                      {...register("licenseNumber", { required: role === "doctor" && "Required" })}
                      className={fieldClass(errors.licenseNumber)}
                    />
                    {errors.licenseNumber && <p className="text-red-400 text-xs">{errors.licenseNumber.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Hospital / Clinic</label>
                    <input placeholder="City Hospital" {...register("hospital")} className={fieldClass(false)} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Consultation Fee (₹)</label>
                    <input type="number" min="0" placeholder="500" {...register("consultationFee")} className={fieldClass(false)} />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-400 hover:to-blue-400 text-white rounded-xl py-3 font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 mt-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Create Account
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-teal-400 hover:text-teal-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;