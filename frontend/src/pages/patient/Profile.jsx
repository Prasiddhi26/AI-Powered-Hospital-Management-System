/**
 * ProfilePage.jsx — Patient Profile
 *
 * Displays and allows editing of:
 *  - Personal info: name, email, phone, gender, date of birth (age auto-computed)
 *  - Address: street, city, state, pincode
 *  - Medical info: blood group, allergies, medical history
 *
 * Uses React Hook Form for all form state.
 * Uses AuthContext.updateUser() to keep Context in sync after save.
 */

import React, { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import { differenceInYears, parseISO, format } from "date-fns";
import {
  FaUser,
  FaEnvelope,
  FaPhoneAlt,
  FaVenusMars,
  FaBirthdayCake,
  FaMapMarkerAlt,
  FaTint,
  FaAllergies,
  FaClipboardList,
  FaEdit,
  FaSave,
  FaTimes,
  FaCamera,
  FaShieldAlt,
  FaCheckCircle,
  FaCity,
  FaFlag,
  FaSortNumericDown,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
//import { authService } from "../../services/api";
import { Button, Card, LoadingSpinner } from "../../components/common";
import API from "../../api/index";

// ─── Constants ────────────────────────────────────────────────────────────────
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const COMMON_ALLERGIES = [
  "Penicillin",
  "Aspirin",
  "Ibuprofen",
  "Sulfa drugs",
  "Latex",
  "Peanuts",
  "Shellfish",
  "Dust",
  "Pollen",
  "Animal dander",
];

// ─── Avatar Uploader ──────────────────────────────────────────────────────────
const AvatarSection = ({ user, editMode }) => {
  const fileRef = useRef();
  const [preview, setPreview] = useState(user?.avatar || "");

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Avatar must be under 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar circle */}
      <div className="relative group">
        {preview ? (
          <img
            src={preview}
            alt={user?.name}
            className="w-28 h-28 rounded-3xl object-cover border-4 border-white shadow-xl"
          />
        ) : (
          <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center text-white text-3xl font-bold shadow-xl border-4 border-white">
            {initials || <FaUser />}
          </div>
        )}

        {/* Camera overlay in edit mode */}
        {editMode && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute inset-0 rounded-3xl bg-black/40 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <FaCamera className="text-white text-xl" />
            <span className="text-white text-xs font-medium">Change</span>
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />

        {/* Online dot */}
        <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-2 border-white rounded-full" />
      </div>

      <div className="text-center">
        <p className="text-lg font-bold text-gray-900 font-display">{user?.name}</p>
        <p className="text-sm text-blue-600 font-medium capitalize">{user?.role}</p>
      </div>
    </div>
  );
};

// ─── Section Title ────────────────────────────────────────────────────────────
const SectionTitle = ({ icon: Icon, title, color = "blue" }) => {
  const colors = {
    blue: "from-blue-500 to-blue-600",
    teal: "from-teal-500 to-teal-600",
    purple: "from-purple-500 to-purple-600",
    red: "from-red-500 to-red-600",
  };
  return (
    <div className="flex items-center gap-3 mb-5 pb-3 border-b border-gray-100">
      <div
        className={`w-9 h-9 bg-gradient-to-br ${colors[color]} rounded-xl flex items-center justify-center shadow-sm`}
      >
        <Icon className="text-white text-sm" />
      </div>
      <h3 className="text-base font-bold text-gray-800">{title}</h3>
    </div>
  );
};

// ─── Field Wrapper ────────────────────────────────────────────────────────────
const Field = ({ label, required, error, children }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium text-gray-700">
      {label}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

// Shared input class helper
const inputCls = (hasError, disabled) =>
  `w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-all ${
    disabled
      ? "bg-gray-50 text-gray-500 cursor-default border-gray-100"
      : hasError
      ? "border-red-300 bg-red-50 focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
      : "border-gray-200 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
  }`;

// ─── Allergy Tag Input ────────────────────────────────────────────────────────
const AllergyInput = ({ value = [], onChange, disabled }) => {
  const [input, setInput] = useState("");

  const add = (tag) => {
    const trimmed = tag.trim();
    if (!trimmed || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setInput("");
  };

  const remove = (tag) => onChange(value.filter((v) => v !== tag));

  return (
    <div className="space-y-2">
      {/* Tag pills */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-full"
            >
              {tag}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => remove(tag)}
                  className="text-red-400 hover:text-red-600 transition-colors"
                >
                  <FaTimes size={9} />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Text input */}
      {!disabled && (
        <>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  add(input);
                }
              }}
              placeholder="Type and press Enter…"
              className={inputCls(false, false)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => add(input)}
            >
              Add
            </Button>
          </div>

          {/* Quick suggestions */}
          <div className="flex flex-wrap gap-1.5">
            {COMMON_ALLERGIES.filter((a) => !value.includes(a)).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => add(a)}
                className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                + {a}
              </button>
            ))}
          </div>
        </>
      )}

      {disabled && value.length === 0 && (
        <p className="text-sm text-gray-400 italic">None recorded</p>
      )}
    </div>
  );
};

// ─── Medical History Textarea ─────────────────────────────────────────────────
const HistoryInput = ({ value = [], onChange, disabled }) => {
  const text = value.join("\n");

  return disabled ? (
    <div className="min-h-[80px] p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-700 leading-relaxed">
      {value.length > 0 ? (
        <ul className="space-y-1">
          {value.map((h, i) => (
            <li key={i} className="flex items-start gap-2">
              <FaCheckCircle className="text-green-400 mt-0.5 flex-shrink-0" size={12} />
              {h}
            </li>
          ))}
        </ul>
      ) : (
        <span className="italic text-gray-400">No history recorded</span>
      )}
    </div>
  ) : (
    <textarea
      rows={4}
      value={text}
      onChange={(e) =>
        onChange(
          e.target.value
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
        )
      }
      placeholder="One entry per line, e.g.&#10;Diabetes (Type 2)&#10;Hypertension&#10;Appendectomy (2018)"
      className={inputCls(false, false) + " resize-none"}
    />
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ProfilePage = () => {
  const { user, updateUser } = useAuth();

  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isDirty },
  } = useForm();

  // Age derived from watched dateOfBirth
  const dob = watch("dateOfBirth");
  const age = dob
    ? differenceInYears(new Date(), new Date(dob))
    : profileData?.age ?? null;

  // ─── Fetch fresh profile on mount ────────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await API.get("/auth/me");
        if (data.success) {
          const u = data.user;
          setProfileData(u);
          resetForm(u);
        }
      } catch (err) {
        toast.error("Could not load profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const resetForm = (u) => {
    reset({
      name: u.name || "",
      phone: u.phone || "",
      gender: u.gender || "",
      dateOfBirth: u.dateOfBirth ? format(new Date(u.dateOfBirth), "yyyy-MM-dd") : "",
      bloodGroup: u.bloodGroup || "",
      "address.street": u.address?.street || "",
      "address.city": u.address?.city || "",
      "address.state": u.address?.state || "",
      "address.pincode": u.address?.pincode || "",
      "address.country": u.address?.country || "India",
      allergies: u.allergies || [],
      medicalHistory: u.medicalHistory || [],
    });
  };

  // ─── Save Handler ─────────────────────────────────────────────────────────
  const onSubmit = async (formValues) => {
    setSaving(true);
    try {
      // Reconstruct address object from flat form keys
      const payload = {
        name: formValues.name,
        phone: formValues.phone,
        gender: formValues.gender,
        dateOfBirth: formValues.dateOfBirth,
        bloodGroup: formValues.bloodGroup,
        allergies: formValues.allergies,
        medicalHistory: formValues.medicalHistory,
        address: {
          street: formValues["address.street"],
          city: formValues["address.city"],
          state: formValues["address.state"],
          pincode: formValues["address.pincode"],
          country: formValues["address.country"],
        },
      };

     const { data } = await API.put("/users/profile", payload);

      if (data.success) {
        setProfileData(data.user);
        updateUser(data.user); // Sync Context
        resetForm(data.user);
        setEditMode(false);
        toast.success("Profile updated successfully! ✅");
      }
    } catch (err) {
      toast.error(err.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    resetForm(profileData);
    setEditMode(false);
  };

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner text="Loading your profile…" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-fade-in">
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">
            My Profile
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage your personal and medical information
          </p>
        </div>

        {!editMode ? (
          <Button
            onClick={() => setEditMode(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FaEdit size={13} />
            Edit Profile
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleCancel}>
              <FaTimes size={13} />
              Cancel
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              loading={saving}
              disabled={!isDirty && !saving}
            >
              <FaSave size={13} />
              Save Changes
            </Button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid lg:grid-cols-[260px,1fr] gap-6">
          {/* ── Left Sidebar ─────────────────────────────────────────────── */}
          <div className="space-y-5">
            {/* Avatar + name */}
            <Card className="flex flex-col items-center py-8">
              <AvatarSection user={profileData} editMode={editMode} />

              {/* Account info pills */}
              <div className="mt-5 w-full space-y-2">
                <div className="flex items-center gap-2 px-3 py-2.5 bg-blue-50 rounded-xl">
                  <FaEnvelope className="text-blue-400 text-xs flex-shrink-0" />
                  <span className="text-xs text-blue-700 font-medium truncate">
                    {profileData?.email}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2.5 bg-green-50 rounded-xl">
                  <FaShieldAlt className="text-green-400 text-xs flex-shrink-0" />
                  <span className="text-xs text-green-700 font-medium">
                    Account Verified
                  </span>
                </div>
                {age !== null && (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-purple-50 rounded-xl">
                    <FaBirthdayCake className="text-purple-400 text-xs flex-shrink-0" />
                    <span className="text-xs text-purple-700 font-medium">
                      {age} years old
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* Quick stats */}
            <Card padding="p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Profile Completeness
              </p>
              {[
                { label: "Basic Info", done: !!(profileData?.name && profileData?.phone) },
                { label: "Address", done: !!profileData?.address?.city },
                { label: "Blood Group", done: !!profileData?.bloodGroup },
                { label: "Medical History", done: (profileData?.medicalHistory?.length || 0) > 0 },
              ].map(({ label, done }) => (
                <div key={label} className="flex items-center gap-2 py-1.5">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                      done ? "bg-green-400" : "bg-gray-200"
                    }`}
                  >
                    {done && <FaCheckCircle className="text-white text-[9px]" />}
                  </div>
                  <span
                    className={`text-xs ${
                      done ? "text-gray-700 font-medium" : "text-gray-400"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </Card>
          </div>

          {/* ── Right Content ─────────────────────────────────────────────── */}
          <div className="space-y-6">
            {/* Personal Information */}
            <Card>
              <SectionTitle
                icon={FaUser}
                title="Personal Information"
                color="blue"
              />

              <div className="grid sm:grid-cols-2 gap-5">
                {/* Full Name */}
                <Field label="Full Name" required error={errors.name?.message}>
                  <input
                    {...register("name", {
                      required: "Full name is required",
                      minLength: {
                        value: 2,
                        message: "Name must be at least 2 characters",
                      },
                    })}
                    disabled={!editMode}
                    placeholder="Your full name"
                    className={inputCls(!!errors.name, !editMode)}
                  />
                </Field>

                {/* Email (read-only always) */}
                <Field label="Email Address">
                  <div className="relative">
                    <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm" />
                    <input
                      value={profileData?.email || ""}
                      readOnly
                      disabled
                      className={`pl-10 ${inputCls(false, true)}`}
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    Email cannot be changed after registration
                  </p>
                </Field>

                {/* Phone */}
                <Field label="Phone Number" error={errors.phone?.message}>
                  <div className="relative">
                    <FaPhoneAlt className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                    <input
                      {...register("phone", {
                        pattern: {
                          value: /^[+\d\s\-()]{7,15}$/,
                          message: "Enter a valid phone number",
                        },
                      })}
                      disabled={!editMode}
                      placeholder="+91 98765 43210"
                      className={`pl-10 ${inputCls(!!errors.phone, !editMode)}`}
                    />
                  </div>
                </Field>

                {/* Gender */}
                <Field label="Gender" error={errors.gender?.message}>
                  <div className="relative">
                    <FaVenusMars className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <select
                      {...register("gender")}
                      disabled={!editMode}
                      className={`pl-10 appearance-none ${inputCls(false, !editMode)}`}
                    >
                      <option value="">Select gender</option>
                      {GENDER_OPTIONS.map((g) => (
                        <option key={g.value} value={g.value}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </Field>

                {/* Date of Birth */}
                <Field label="Date of Birth" error={errors.dateOfBirth?.message}>
                  <div className="relative">
                    <FaBirthdayCake className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                    <input
                      type="date"
                      {...register("dateOfBirth", {
                        validate: (v) => {
                          if (!v) return true;
                          return (
                            new Date(v) < new Date() ||
                            "Date of birth cannot be in the future"
                          );
                        },
                      })}
                      disabled={!editMode}
                      max={format(new Date(), "yyyy-MM-dd")}
                      className={`pl-10 ${inputCls(!!errors.dateOfBirth, !editMode)}`}
                    />
                  </div>
                  {age !== null && !editMode && (
                    <p className="text-xs text-gray-400">Age: {age} years</p>
                  )}
                </Field>

                {/* Blood Group */}
                <Field label="Blood Group" error={errors.bloodGroup?.message}>
                  <div className="relative">
                    <FaTint className="absolute left-3.5 top-1/2 -translate-y-1/2 text-red-400 text-sm" />
                    <select
                      {...register("bloodGroup")}
                      disabled={!editMode}
                      className={`pl-10 appearance-none ${inputCls(false, !editMode)}`}
                    >
                      <option value="">Select blood group</option>
                      {BLOOD_GROUPS.map((bg) => (
                        <option key={bg} value={bg}>
                          {bg}
                        </option>
                      ))}
                    </select>
                  </div>
                </Field>
              </div>
            </Card>

            {/* Address */}
            <Card>
              <SectionTitle
                icon={FaMapMarkerAlt}
                title="Address"
                color="teal"
              />

              <div className="grid sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <Field label="Street Address">
                    <div className="relative">
                      <FaMapMarkerAlt className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                      <input
                        {...register("address.street")}
                        disabled={!editMode}
                        placeholder="123 MG Road, Near City Mall"
                        className={`pl-10 ${inputCls(false, !editMode)}`}
                      />
                    </div>
                  </Field>
                </div>

                <Field label="City">
                  <div className="relative">
                    <FaCity className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                    <input
                      {...register("address.city")}
                      disabled={!editMode}
                      placeholder="Mumbai"
                      className={`pl-10 ${inputCls(false, !editMode)}`}
                    />
                  </div>
                </Field>

                <Field label="State">
                  <input
                    {...register("address.state")}
                    disabled={!editMode}
                    placeholder="Maharashtra"
                    className={inputCls(false, !editMode)}
                  />
                </Field>

                <Field label="Pincode">
                  <div className="relative">
                    <FaSortNumericDown className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                    <input
                      {...register("address.pincode", {
                        pattern: {
                          value: /^\d{4,10}$/,
                          message: "Enter a valid pincode",
                        },
                      })}
                      disabled={!editMode}
                      placeholder="400001"
                      className={`pl-10 ${inputCls(!!errors["address.pincode"], !editMode)}`}
                    />
                  </div>
                </Field>

                <Field label="Country">
                  <div className="relative">
                    <FaFlag className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                    <input
                      {...register("address.country")}
                      disabled={!editMode}
                      placeholder="India"
                      className={`pl-10 ${inputCls(false, !editMode)}`}
                    />
                  </div>
                </Field>
              </div>
            </Card>

            {/* Medical Information */}
            <Card>
              <SectionTitle
                icon={FaAllergies}
                title="Medical Information"
                color="purple"
              />

              <div className="space-y-6">
                {/* Allergies */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <FaAllergies className="text-red-400" size={13} />
                    Known Allergies
                  </p>
                  <Controller
                    name="allergies"
                    control={control}
                    defaultValue={[]}
                    render={({ field }) => (
                      <AllergyInput
                        value={field.value}
                        onChange={field.onChange}
                        disabled={!editMode}
                      />
                    )}
                  />
                </div>

                <div className="border-t border-gray-100" />

                {/* Medical History */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <FaClipboardList className="text-purple-400" size={13} />
                    Medical History
                  </p>
                  <p className="text-xs text-gray-400 mb-3">
                    Past diagnoses, surgeries, chronic conditions — one per line
                  </p>
                  <Controller
                    name="medicalHistory"
                    control={control}
                    defaultValue={[]}
                    render={({ field }) => (
                      <HistoryInput
                        value={field.value}
                        onChange={field.onChange}
                        disabled={!editMode}
                      />
                    )}
                  />
                </div>
              </div>
            </Card>

            {/* Save / Cancel — bottom bar (visible in edit mode) */}
            {editMode && (
              <div className="flex items-center justify-end gap-3 pt-2 pb-4">
                <Button variant="secondary" onClick={handleCancel}>
                  <FaTimes size={13} />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={saving}
                  disabled={!isDirty && !saving}
                  size="lg"
                >
                  <FaSave size={14} />
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;