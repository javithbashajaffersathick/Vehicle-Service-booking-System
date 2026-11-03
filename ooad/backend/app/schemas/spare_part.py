from datetime import datetime
from decimal import Decimal
from typing import Optional, Any
from pydantic import BaseModel, Field, ConfigDict, model_validator
from app.models.inventory_movement import MovementType


class SparePartBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    sku: Optional[str] = Field(None, min_length=1, max_length=50)
    part_number: Optional[str] = Field(None, min_length=1, max_length=50)
    quantity: Optional[int] = Field(None, ge=0)
    stock_quantity: Optional[int] = Field(None, ge=0)
    reorder_threshold: Optional[int] = Field(None, ge=0)
    min_stock_level: Optional[int] = Field(None, ge=0)
    unit_price: Optional[Decimal] = Field(None, ge=0)
    price: Optional[Decimal] = Field(None, ge=0)
    category: Optional[str] = "Auto Parts"
    is_active: bool = True

    @model_validator(mode="before")
    @classmethod
    def sync_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # Sku & part_number
            sku_val = data.get("sku") or data.get("part_number")
            if sku_val:
                data["sku"] = sku_val
                data["part_number"] = sku_val
            # Price & unit_price
            price_val = data.get("unit_price") if data.get("unit_price") is not None else data.get("price")
            if price_val is not None:
                data["unit_price"] = price_val
                data["price"] = price_val
            # Quantity & stock_quantity
            qty_val = data.get("quantity") if data.get("quantity") is not None else data.get("stock_quantity")
            if qty_val is not None:
                data["quantity"] = qty_val
                data["stock_quantity"] = qty_val
            # Reorder threshold & min_stock_level
            thresh_val = data.get("reorder_threshold") if data.get("reorder_threshold") is not None else data.get("min_stock_level")
            if thresh_val is not None:
                data["reorder_threshold"] = thresh_val
                data["min_stock_level"] = thresh_val
        return data


class SparePartCreate(SparePartBase):
    @model_validator(mode="after")
    def validate_required_fields(self) -> "SparePartCreate":
        if not self.sku:
            raise ValueError("sku or part_number is required")
        if self.unit_price is None:
            raise ValueError("unit_price or price is required")
        if self.quantity is None:
            self.quantity = 0
            self.stock_quantity = 0
        if self.reorder_threshold is None:
            self.reorder_threshold = 5
            self.min_stock_level = 5
        return self


class SparePartUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    sku: Optional[str] = Field(None, min_length=1, max_length=50)
    part_number: Optional[str] = Field(None, min_length=1, max_length=50)
    quantity: Optional[int] = Field(None, ge=0)
    stock_quantity: Optional[int] = Field(None, ge=0)
    reorder_threshold: Optional[int] = Field(None, ge=0)
    min_stock_level: Optional[int] = Field(None, ge=0)
    unit_price: Optional[Decimal] = Field(None, ge=0)
    price: Optional[Decimal] = Field(None, ge=0)
    category: Optional[str] = None
    is_active: Optional[bool] = None

    @model_validator(mode="before")
    @classmethod
    def sync_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            sku_val = data.get("sku") or data.get("part_number")
            if sku_val:
                data["sku"] = sku_val
                data["part_number"] = sku_val
            price_val = data.get("unit_price") if data.get("unit_price") is not None else data.get("price")
            if price_val is not None:
                data["unit_price"] = price_val
                data["price"] = price_val
            qty_val = data.get("quantity") if data.get("quantity") is not None else data.get("stock_quantity")
            if qty_val is not None:
                data["quantity"] = qty_val
                data["stock_quantity"] = qty_val
            thresh_val = data.get("reorder_threshold") if data.get("reorder_threshold") is not None else data.get("min_stock_level")
            if thresh_val is not None:
                data["reorder_threshold"] = thresh_val
                data["min_stock_level"] = thresh_val
        return data


class SparePartResponse(SparePartBase):
    id: int
    created_at: datetime
    is_low_stock: bool = False
    sku: str = ""
    part_number: str = ""
    quantity: int = 0
    stock_quantity: int = 0
    reorder_threshold: int = 5
    min_stock_level: int = 5
    unit_price: Decimal = Decimal("0.00")
    price: Decimal = Decimal("0.00")

    @model_validator(mode="before")
    @classmethod
    def populate_response(cls, data: Any) -> Any:
        if hasattr(data, "id"):
            sku = getattr(data, "sku", "")
            qty = getattr(data, "quantity", 0)
            thresh = getattr(data, "reorder_threshold", 5)
            u_price = getattr(data, "unit_price", Decimal("0.00"))
            return {
                "id": getattr(data, "id"),
                "name": getattr(data, "name"),
                "sku": sku,
                "part_number": sku,
                "quantity": qty,
                "stock_quantity": qty,
                "reorder_threshold": thresh,
                "min_stock_level": thresh,
                "unit_price": u_price,
                "price": u_price,
                "category": "Auto Parts",
                "is_active": getattr(data, "is_active", True),
                "created_at": getattr(data, "created_at"),
                "is_low_stock": qty <= thresh,
            }
        return data

    model_config = ConfigDict(from_attributes=True)


class StockAdjustment(BaseModel):
    quantity_change: int
    movement_type: MovementType = MovementType.adjustment
    notes: Optional[str] = None


class InventoryMovementResponse(BaseModel):
    id: int
    spare_part_id: int
    booking_id: Optional[int] = None
    quantity_change: int
    movement_type: MovementType
    recorded_by_id: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime
    spare_part_name: Optional[str] = None
    spare_part_sku: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
