import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";

type ApplicationStep = 1 | 2 | 3 | 4 | 5 | 6;

interface ApplicationData {
  propertyId?: number;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  ssnLast4: string;
  currentAddress: string;
  currentCity: string;
  currentState: string;
  currentZip: string;
  moveInDate: string;
  moveOutDate: string;
  currentRent: string;
  reasonForLeaving: string;
  previousAddress: string;
  previousLandlordName: string;
  previousLandlordPhone: string;
  employerName: string;
  employerAddress: string;
  position: string;
  employmentLength: string;
  monthlyIncome: string;
  supervisorName: string;
  supervisorPhone: string;
  additionalIncome: string;
  additionalIncomeSource: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  hasPets: boolean;
  petDetails: string;
  hasVehicles: boolean;
  vehicleDetails: string;
  additionalOccupants: string;
  consentGiven: boolean;
  idDocumentUrl?: string;
  incomeProofUrl?: string;
}

export default function Apply() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1]);
  const propertyIdParam = searchParams.get('propertyId');
  
  const [currentStep, setCurrentStep] = useState<ApplicationStep>(1);
  const [isUploadingId, setIsUploadingId] = useState(false);
  const [isUploadingIncome, setIsUploadingIncome] = useState(false);
  const [formData, setFormData] = useState<ApplicationData>({
    propertyId: propertyIdParam ? parseInt(propertyIdParam) : undefined,
    fullName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    ssnLast4: "",
    currentAddress: "",
    currentCity: "",
    currentState: "",
    currentZip: "",
    moveInDate: "",
    moveOutDate: "",
    currentRent: "",
    reasonForLeaving: "",
    previousAddress: "",
    previousLandlordName: "",
    previousLandlordPhone: "",
    employerName: "",
    employerAddress: "",
    position: "",
    employmentLength: "",
    monthlyIncome: "",
    supervisorName: "",
    supervisorPhone: "",
    additionalIncome: "",
    additionalIncomeSource: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "",
    hasPets: false,
    petDetails: "",
    hasVehicles: false,
    vehicleDetails: "",
    additionalOccupants: "",
    consentGiven: false,
  });

  const createApplicationMutation = trpc.applications.create.useMutation();
  const uploadDocumentMutation = trpc.applications.uploadDocument.useMutation();

  const updateField = (field: keyof ApplicationData, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to read file as base64"));
        }
      };
      reader.onerror = () => reject(reader.error || new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (file: File, target: "id" | "income") => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload image files only (e.g. JPG, PNG).");
      return;
    }

    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast.error("File is too large. Maximum size is 5MB.");
      return;
    }

    try {
      if (target === "id") {
        setIsUploadingId(true);
      } else {
        setIsUploadingIncome(true);
      }

      const base64 = await fileToBase64(file);

      const json = await uploadDocumentMutation.mutateAsync({
        imageBase64: base64,
        category: target,
      });

      if (!json.url) {
        toast.error("Upload succeeded but no URL was returned");
        return;
      }

      if (target === "id") {
        updateField("idDocumentUrl", json.url);
      } else {
        updateField("incomeProofUrl", json.url);
      }

      toast.success("File uploaded successfully");
    } catch (error: any) {
      console.error("File upload error:", error);
      const message =
        error?.message ||
        (error?.data && (error.data.message as string)) ||
        "Unexpected error during upload. Please try again.";
      toast.error(message);
    } finally {
      if (target === "id") {
        setIsUploadingId(false);
      } else {
        setIsUploadingIncome(false);
      }
    }
  };

  const validateStep = (step: ApplicationStep): boolean => {
    switch (step) {
      case 1:
        return !!(formData.fullName && formData.email && formData.phone && formData.dateOfBirth);
      case 2:
        return !!(formData.currentAddress && formData.currentCity && formData.currentState);
      case 3:
        return !!(formData.employerName && formData.position && formData.monthlyIncome);
      case 4:
        return !!(formData.emergencyContactName && formData.emergencyContactPhone);
      case 5:
        return true;
      case 6:
        return formData.consentGiven;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (!validateStep(currentStep)) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (currentStep < 6) {
      setCurrentStep((currentStep + 1) as ApplicationStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as ApplicationStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(6)) {
      toast.error("Please review and accept the consent agreement");
      return;
    }

    try {
      await createApplicationMutation.mutateAsync({
        propertyId: formData.propertyId || 0,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        ssnLast4: formData.ssnLast4,
        currentAddress: `${formData.currentAddress}, ${formData.currentCity}, ${formData.currentState} ${formData.currentZip}`,
        moveInDate: formData.moveInDate,
        moveOutDate: formData.moveOutDate,
        reasonForLeaving: formData.reasonForLeaving,
        previousLandlordName: formData.previousLandlordName,
        previousLandlordPhone: formData.previousLandlordPhone,
        employerName: formData.employerName,
        position: formData.position,
        monthlyIncome: parseInt(formData.monthlyIncome) * 100,
        supervisorContact: `${formData.supervisorName} - ${formData.supervisorPhone}`,
        employerAddress: formData.employerAddress || undefined,
        employmentLength: formData.employmentLength || undefined,
        additionalIncome: formData.additionalIncome || undefined,
        additionalIncomeSource: formData.additionalIncomeSource || undefined,
        supervisorName: formData.supervisorName || undefined,
        supervisorPhone: formData.supervisorPhone || undefined,
        pets: formData.hasPets ? formData.petDetails : undefined,
        vehicles: formData.hasVehicles ? formData.vehicleDetails : undefined,
        hasPets: formData.hasPets,
        hasVehicles: formData.hasVehicles,
        additionalOccupants: formData.additionalOccupants || undefined,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
        emergencyContactRelation: formData.emergencyContactRelation || undefined,
        consentGiven: formData.consentGiven,
        signatureDate: new Date(),
        idDocumentUrl: formData.idDocumentUrl,
        incomeProofUrl: formData.incomeProofUrl,
      });

      toast.success("Application submitted successfully!");
      setCurrentStep(1);
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        dateOfBirth: "",
        ssnLast4: "",
        currentAddress: "",
        currentCity: "",
        currentState: "",
        currentZip: "",
        moveInDate: "",
        moveOutDate: "",
        currentRent: "",
        reasonForLeaving: "",
        previousAddress: "",
        previousLandlordName: "",
        previousLandlordPhone: "",
        employerName: "",
        employerAddress: "",
        position: "",
        employmentLength: "",
        monthlyIncome: "",
        supervisorName: "",
        supervisorPhone: "",
        additionalIncome: "",
        additionalIncomeSource: "",
        emergencyContactName: "",
        emergencyContactPhone: "",
        emergencyContactRelation: "",
        hasPets: false,
        petDetails: "",
        hasVehicles: false,
        vehicleDetails: "",
        additionalOccupants: "",
        consentGiven: false,
      });
    } catch (error) {
      toast.error("Failed to submit application. Please try again.");
    }
  };

  const progress = (currentStep / 6) * 100;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-12 bg-gray-50">
        <div className="container max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Rental Application</h1>
            <p className="text-muted-foreground text-lg">
              Complete all sections to submit your application
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Step {currentStep} of 6</span>
              <span className="text-muted-foreground">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Requirements Notice */}
          {currentStep === 1 && (
            <Card className="mb-8 border-secondary">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Before you begin, here's what you'll need:</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Photo ID</p>
                      <p className="text-sm text-muted-foreground">Driver's license, Passport, or Military ID</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Landlord Contact Info</p>
                      <p className="text-sm text-muted-foreground">Previous & current landlord references</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Proof of Income</p>
                      <p className="text-sm text-muted-foreground">W2, paystub, or bank statements</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Form Steps */}
          <Card>
            <CardHeader>
              <CardTitle>
                {currentStep === 1 && "Personal Information"}
                {currentStep === 2 && "Current & Previous Residence"}
                {currentStep === 3 && "Employment & Income"}
                {currentStep === 4 && "Emergency Contact & Additional Info"}
                {currentStep === 5 && "Upload Documents"}
                {currentStep === 6 && "Review & Submit"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Personal Information */}
              {currentStep === 1 && (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => updateField('fullName', e.target.value)}
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        placeholder="(123) 456-7890"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => updateField('dateOfBirth', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ssnLast4">Last 4 Digits of SSN</Label>
                      <Input
                        id="ssnLast4"
                        maxLength={4}
                        value={formData.ssnLast4}
                        onChange={(e) => updateField('ssnLast4', e.target.value)}
                        placeholder="1234"
                      />
                      <p className="text-xs text-muted-foreground mt-1">For background check purposes</p>
                    </div>
                  </div>
                </>
              )}

              {/* Step 2: Current & Previous Residence */}
              {currentStep === 2 && (
                <>
                  <div>
                    <h3 className="font-semibold mb-4">Current Residence</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="currentAddress">Street Address *</Label>
                        <Input
                          id="currentAddress"
                          value={formData.currentAddress}
                          onChange={(e) => updateField('currentAddress', e.target.value)}
                          placeholder="123 Main Street, Apt 4B"
                        />
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="currentCity">City *</Label>
                          <Input
                            id="currentCity"
                            value={formData.currentCity}
                            onChange={(e) => updateField('currentCity', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="currentState">State *</Label>
                          <Input
                            id="currentState"
                            value={formData.currentState}
                            onChange={(e) => updateField('currentState', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="currentZip">ZIP Code</Label>
                          <Input
                            id="currentZip"
                            value={formData.currentZip}
                            onChange={(e) => updateField('currentZip', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="moveInDate">Move-in Date</Label>
                          <Input
                            id="moveInDate"
                            type="date"
                            value={formData.moveInDate}
                            onChange={(e) => updateField('moveInDate', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="currentRent">Current Monthly Rent</Label>
                          <Input
                            id="currentRent"
                            type="number"
                            value={formData.currentRent}
                            onChange={(e) => updateField('currentRent', e.target.value)}
                            placeholder="1500"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="reasonForLeaving">Reason for Leaving</Label>
                        <Textarea
                          id="reasonForLeaving"
                          value={formData.reasonForLeaving}
                          onChange={(e) => updateField('reasonForLeaving', e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t">
                    <h3 className="font-semibold mb-4">Previous Landlord Reference</h3>
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="previousLandlordName">Landlord Name</Label>
                          <Input
                            id="previousLandlordName"
                            value={formData.previousLandlordName}
                            onChange={(e) => updateField('previousLandlordName', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="previousLandlordPhone">Landlord Phone</Label>
                          <Input
                            id="previousLandlordPhone"
                            type="tel"
                            value={formData.previousLandlordPhone}
                            onChange={(e) => updateField('previousLandlordPhone', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Step 3: Employment & Income */}
              {currentStep === 3 && (
                <>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="employerName">Employer Name *</Label>
                        <Input
                          id="employerName"
                          value={formData.employerName}
                          onChange={(e) => updateField('employerName', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="position">Position/Title *</Label>
                        <Input
                          id="position"
                          value={formData.position}
                          onChange={(e) => updateField('position', e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="employerAddress">Employer Address</Label>
                      <Input
                        id="employerAddress"
                        value={formData.employerAddress}
                        onChange={(e) => updateField('employerAddress', e.target.value)}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="employmentLength">Length of Employment</Label>
                        <Input
                          id="employmentLength"
                          value={formData.employmentLength}
                          onChange={(e) => updateField('employmentLength', e.target.value)}
                          placeholder="2 years"
                        />
                      </div>
                      <div>
                        <Label htmlFor="monthlyIncome">Monthly Gross Income *</Label>
                        <Input
                          id="monthlyIncome"
                          type="number"
                          value={formData.monthlyIncome}
                          onChange={(e) => updateField('monthlyIncome', e.target.value)}
                          placeholder="5000"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="supervisorName">Supervisor Name</Label>
                        <Input
                          id="supervisorName"
                          value={formData.supervisorName}
                          onChange={(e) => updateField('supervisorName', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="supervisorPhone">Supervisor Phone</Label>
                        <Input
                          id="supervisorPhone"
                          type="tel"
                          value={formData.supervisorPhone}
                          onChange={(e) => updateField('supervisorPhone', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="additionalIncome">Additional Monthly Income</Label>
                        <Input
                          id="additionalIncome"
                          type="number"
                          value={formData.additionalIncome}
                          onChange={(e) => updateField('additionalIncome', e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="additionalIncomeSource">Source of Additional Income</Label>
                        <Input
                          id="additionalIncomeSource"
                          value={formData.additionalIncomeSource}
                          onChange={(e) => updateField('additionalIncomeSource', e.target.value)}
                          placeholder="e.g., Part-time job, investments"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Step 4: Emergency Contact & Additional Info */}
              {currentStep === 4 && (
                <>
                  <div>
                    <h3 className="font-semibold mb-4">Emergency Contact</h3>
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="emergencyContactName">Full Name *</Label>
                          <Input
                            id="emergencyContactName"
                            value={formData.emergencyContactName}
                            onChange={(e) => updateField('emergencyContactName', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="emergencyContactPhone">Phone Number *</Label>
                          <Input
                            id="emergencyContactPhone"
                            type="tel"
                            value={formData.emergencyContactPhone}
                            onChange={(e) => updateField('emergencyContactPhone', e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="emergencyContactRelation">Relationship</Label>
                        <Input
                          id="emergencyContactRelation"
                          value={formData.emergencyContactRelation}
                          onChange={(e) => updateField('emergencyContactRelation', e.target.value)}
                          placeholder="e.g., Parent, Sibling, Friend"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t">
                    <h3 className="font-semibold mb-4">Additional Information</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Checkbox
                            id="hasPets"
                            checked={formData.hasPets}
                            onCheckedChange={(checked) => updateField('hasPets', checked as boolean)}
                          />
                          <Label htmlFor="hasPets" className="cursor-pointer">I have pets</Label>
                        </div>
                        {formData.hasPets && (
                          <Textarea
                            placeholder="Please describe your pets (type, breed, weight, age)"
                            value={formData.petDetails}
                            onChange={(e) => updateField('petDetails', e.target.value)}
                            rows={3}
                          />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Checkbox
                            id="hasVehicles"
                            checked={formData.hasVehicles}
                            onCheckedChange={(checked) => updateField('hasVehicles', checked as boolean)}
                          />
                          <Label htmlFor="hasVehicles" className="cursor-pointer">I have vehicles</Label>
                        </div>
                        {formData.hasVehicles && (
                          <Textarea
                            placeholder="Please list your vehicles (make, model, year, license plate)"
                            value={formData.vehicleDetails}
                            onChange={(e) => updateField('vehicleDetails', e.target.value)}
                            rows={3}
                          />
                        )}
                      </div>

                      <div>
                        <Label htmlFor="additionalOccupants">Additional Occupants</Label>
                        <Textarea
                          id="additionalOccupants"
                          placeholder="List any additional people who will be living with you (names and ages)"
                          value={formData.additionalOccupants}
                          onChange={(e) => updateField('additionalOccupants', e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Step 5: Upload Documents */}
              {currentStep === 5 && (
                <>
                  <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-900">Document Upload</p>
                          <p className="text-sm text-blue-700 mt-1">
                            Please upload clear copies of your photo ID and proof of income. Accepted formats: JPG, PNG (max 5MB each)
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-secondary transition-colors">
                        <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h4 className="font-medium mb-2">Photo ID</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Driver's license, Passport, or Military ID
                        </p>
                        <input
                          id="photoIdInput"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file, "id");
                          }}
                        />
                        <Button
                          variant="outline"
                          onClick={() =>
                            document.getElementById("photoIdInput")?.click()
                          }
                          disabled={isUploadingId}
                        >
                          {isUploadingId ? "Uploading..." : "Choose File"}
                        </Button>
                        {formData.idDocumentUrl && (
                          <p className="text-xs text-green-700 mt-2">
                            File uploaded.
                          </p>
                        )}
                      </div>

                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-secondary transition-colors">
                        <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h4 className="font-medium mb-2">Proof of Income</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          W2, recent paystubs, or bank statements
                        </p>
                        <input
                          id="incomeInput"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file, "income");
                          }}
                        />
                        <Button
                          variant="outline"
                          onClick={() =>
                            document.getElementById("incomeInput")?.click()
                          }
                          disabled={isUploadingIncome}
                        >
                          {isUploadingIncome ? "Uploading..." : "Choose File"}
                        </Button>
                        {formData.incomeProofUrl && (
                          <p className="text-xs text-green-700 mt-2">
                            File uploaded.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium mb-2">Privacy & Security</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Your documents are encrypted and stored securely</li>
                        <li>• We never share your information with third parties</li>
                        <li>• Documents are destroyed if you don't proceed or are not approved</li>
                      </ul>
                    </div>
                  </div>
                </>
              )}

              {/* Step 6: Review & Submit */}
              {currentStep === 6 && (
                <>
                  <div className="space-y-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-green-900">Almost Done!</p>
                          <p className="text-sm text-green-700 mt-1">
                            Please review your information and accept the consent agreement below to submit your application.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-muted-foreground">Full Name</p>
                          <p>{formData.fullName}</p>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">Email</p>
                          <p>{formData.email}</p>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">Phone</p>
                          <p>{formData.phone}</p>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">Monthly Income</p>
                          <p>${formData.monthlyIncome}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t">
                      <h3 className="font-semibold mb-4">Consent & Authorization</h3>
                      <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-64 overflow-y-auto text-sm">
                        <p className="mb-3">
                          By submitting this application, I certify that all information provided is true and complete to the best of my knowledge. I understand that false information may result in denial of my application or termination of my lease agreement.
                        </p>
                        <p className="mb-3">
                          I authorize KCO Properties, LLC to verify the information provided and to obtain a consumer credit report and criminal background check. I understand that this is a soft inquiry and will not affect my credit score.
                        </p>
                        <p className="mb-3">
                          I understand that submission of this application does not guarantee approval or reservation of the property. The application will be processed in the order received, and approval is subject to verification of all information and satisfactory credit and background checks.
                        </p>
                        <p>
                          I acknowledge that KCO Properties, LLC complies with all Fair Housing laws and does not discriminate based on race, color, religion, sex, national origin, familial status, or disability.
                        </p>
                      </div>

                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="consentGiven"
                          checked={formData.consentGiven}
                          onCheckedChange={(checked) => updateField('consentGiven', checked as boolean)}
                        />
                        <Label htmlFor="consentGiven" className="cursor-pointer leading-relaxed">
                          I have read and agree to the above consent and authorization. I understand that by checking this box, I am providing my electronic signature.
                        </Label>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                >
                  Previous
                </Button>
                
                {currentStep < 6 ? (
                  <Button
                    onClick={nextStep}
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                  >
                    Next Step
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={!formData.consentGiven || createApplicationMutation.isPending}
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                  >
                    {createApplicationMutation.isPending ? "Submitting..." : "Submit Application"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
