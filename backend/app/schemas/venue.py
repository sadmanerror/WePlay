from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.match import LatLng
from app.schemas.user import UserOut


class VenueSlotBase(BaseModel):
    start_time: datetime = Field(..., alias="startTime")
    end_time: datetime = Field(..., alias="endTime")
    price: float
    is_off_peak: bool = Field(False, alias="isOffPeak")
    is_booked: bool = Field(False, alias="isBooked")

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class VenueSlotOut(VenueSlotBase):
    id: str
    venue_id: str = Field(..., alias="venueId")


class VenueBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    address: str
    location: LatLng
    sports: List[str] = Field(default_factory=lambda: ["football", "cricket"])
    image_url: Optional[str] = Field(None, alias="imageUrl")
    hourly_rate: float = Field(1200.0, alias="hourlyRate")
    rating: float = 4.8
    is_verified: bool = Field(True, alias="isVerified")
    contact_person: Optional[str] = Field(None, alias="contactPerson")
    contact_phone: Optional[str] = Field(None, alias="contactPhone")
    surface_type: Optional[str] = Field(None, alias="surfaceType")
    amenities: Optional[List[str]] = Field(default_factory=list)
    off_peak_rate: Optional[float] = Field(None, alias="offPeakRate")
    opening_hour: Optional[int] = Field(8, alias="openingHour")
    closing_hour: Optional[int] = Field(22, alias="closingHour")

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class VenueCreate(VenueBase):
    pass


class VenueOut(VenueBase):
    id: str
    owner_id: Optional[str] = Field(None, alias="ownerId")
    contactPerson: Optional[str] = None
    contactPhone: Optional[str] = None
    surfaceType: Optional[str] = None
    offPeakRate: Optional[float] = None
    openingHour: Optional[int] = None
    closingHour: Optional[int] = None
    slots: List[VenueSlotOut] = []
    created_at: datetime = Field(..., alias="createdAt")

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    def model_post_init(self, __context):
        if not self.contactPerson and self.contact_person:
            self.contactPerson = self.contact_person
        if not self.contactPhone and self.contact_phone:
            self.contactPhone = self.contact_phone
        if not self.surfaceType and self.surface_type:
            self.surfaceType = self.surface_type
        if not self.offPeakRate and self.off_peak_rate is not None:
            self.offPeakRate = self.off_peak_rate
        if not self.openingHour and self.opening_hour is not None:
            self.openingHour = self.opening_hour
        if not self.closingHour and self.closing_hour is not None:
            self.closingHour = self.closing_hour


class VenueReservationCreate(BaseModel):
    pass # slot_id is in the path


class VenueReservationOut(BaseModel):
    id: str
    venue_id: str = Field(..., alias="venueId")
    slot_id: str = Field(..., alias="slotId")
    user_id: str = Field(..., alias="userId")
    amount: float
    status: str
    created_at: datetime = Field(..., alias="createdAt")
    slot: Optional[VenueSlotOut] = None

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)
