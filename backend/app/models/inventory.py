from sqlalchemy import Column, String, Float, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.models.base import TenantModel

class StockMovement(TenantModel):
    __tablename__ = "stock_movements"

    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    variant_id = Column(String(36), ForeignKey("product_variants.id", ondelete="CASCADE"), nullable=True, index=True)
    warehouse_id = Column(String(36), ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False, index=True)
    movement_type = Column(String(50), nullable=False, index=True) 
    # Types: Opening Stock, Purchase, Sale, Purchase Return, Sales Return, Stock Adjustment, Stock Transfer, Damaged, Expired
    
    quantity = Column(Float, nullable=False) # positive for inbound, negative for outbound
    previous_quantity = Column(Float, nullable=False)
    new_quantity = Column(Float, nullable=False)
    
    reference_type = Column(String(50), nullable=True) # Sale, Purchase, Adjustment, Transfer
    reference_id = Column(String(100), nullable=True)
    reason = Column(String(255), nullable=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    product = relationship("Product")
    variant = relationship("ProductVariant")
    warehouse = relationship("Warehouse")
    user = relationship("User")

class StockAdjustment(TenantModel):
    __tablename__ = "stock_adjustments"

    adjustment_number = Column(String(50), nullable=False, index=True)
    warehouse_id = Column(String(36), ForeignKey("warehouses.id"), nullable=False)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    variant_id = Column(String(36), ForeignKey("product_variants.id"), nullable=True)
    quantity_adjusted = Column(Float, nullable=False) # e.g. -3 or +5
    previous_quantity = Column(Float, nullable=False)
    new_quantity = Column(Float, nullable=False)
    reason = Column(String(255), nullable=False)
    notes = Column(Text, nullable=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)

    warehouse = relationship("Warehouse")
    product = relationship("Product")
    variant = relationship("ProductVariant")
    user = relationship("User")

class StockTransfer(TenantModel):
    __tablename__ = "stock_transfers"

    transfer_number = Column(String(50), nullable=False, index=True)
    from_warehouse_id = Column(String(36), ForeignKey("warehouses.id"), nullable=False)
    to_warehouse_id = Column(String(36), ForeignKey("warehouses.id"), nullable=False)
    status = Column(String(50), default="Draft") # Draft, Requested, Approved, In Transit, Received, Cancelled
    notes = Column(Text, nullable=True)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)

    from_warehouse = relationship("Warehouse", foreign_keys=[from_warehouse_id])
    to_warehouse = relationship("Warehouse", foreign_keys=[to_warehouse_id])
    user = relationship("User", foreign_keys=[created_by])
    items = relationship("StockTransferItem", back_populates="transfer", cascade="all, delete-orphan")

class StockTransferItem(TenantModel):
    __tablename__ = "stock_transfer_items"

    transfer_id = Column(String(36), ForeignKey("stock_transfers.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    variant_id = Column(String(36), ForeignKey("product_variants.id"), nullable=True)
    quantity = Column(Float, nullable=False)

    transfer = relationship("StockTransfer", back_populates="items")
    product = relationship("Product")
    variant = relationship("ProductVariant")
