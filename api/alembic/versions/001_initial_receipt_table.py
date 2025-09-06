"""Initial receipt table creation

Revision ID: 001_initial_receipt_table
Revises: 
Create Date: 2025-08-25 10:30:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '001_initial_receipt_table'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create receipts table
    op.create_table(
        'receipts',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('receiver_name', sa.String(255), nullable=False),
        sa.Column('contact_number', sa.String(50), nullable=False),
        sa.Column('branch', sa.String(100), nullable=False),
        sa.Column('company', sa.String(255), nullable=False),
        sa.Column('count_boxes', sa.Integer(), nullable=False),
        sa.Column('receiving_mode', sa.Enum('PERSON', 'COURIER', name='receivingmodeenum'), nullable=False),
        sa.Column('forward_to_central', sa.Boolean(), nullable=False, default=False),
        sa.Column('courier_awb', sa.String(100), nullable=True),
        sa.Column('receipt_date', sa.String(10), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    
    # Create indexes
    op.create_index('ix_receipts_id', 'receipts', ['id'])
    op.create_index('ix_receipts_receiver_name', 'receipts', ['receiver_name'])
    op.create_index('ix_receipts_branch', 'receipts', ['branch'])
    op.create_index('ix_receipts_company', 'receipts', ['company'])
    op.create_index('ix_receipts_receiving_mode', 'receipts', ['receiving_mode'])
    op.create_index('ix_receipts_courier_awb', 'receipts', ['courier_awb'])
    op.create_index('ix_receipts_created_at', 'receipts', ['created_at'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_receipts_created_at', 'receipts')
    op.drop_index('ix_receipts_courier_awb', 'receipts')
    op.drop_index('ix_receipts_receiving_mode', 'receipts')
    op.drop_index('ix_receipts_company', 'receipts')
    op.drop_index('ix_receipts_branch', 'receipts')
    op.drop_index('ix_receipts_receiver_name', 'receipts')
    op.drop_index('ix_receipts_id', 'receipts')
    
    # Drop table
    op.drop_table('receipts')
    
    # Drop enum
    op.execute('DROP TYPE IF EXISTS receivingmodeenum')
