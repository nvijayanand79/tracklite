"""Add reports table

Revision ID: 002_add_reports_table
Revises: 001_initial_receipt_table
Create Date: 2025-08-26

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '002_add_reports_table'
down_revision = '001_initial_receipt_table'
branch_labels = None
depends_on = None


def upgrade():
    # Create reports table
    op.create_table(
        'reports',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('labtest_id', sa.String(36), sa.ForeignKey('labtests.id', ondelete='CASCADE'), nullable=False),
        sa.Column('retesting_requested', sa.Boolean(), nullable=False, default=False),
        sa.Column('final_status', sa.Enum('DRAFT', 'READY_FOR_APPROVAL', 'APPROVED', 'REJECTED', name='finalstatus'), nullable=False, default='DRAFT'),
        sa.Column('approved_by', sa.String(), nullable=True),
        sa.Column('comm_status', sa.Enum('PENDING', 'DISPATCHED', 'DELIVERED', name='communicationstatus'), nullable=False, default='PENDING'),
        sa.Column('comm_channel', sa.Enum('COURIER', 'IN_PERSON', 'EMAIL', name='communicationchannel'), nullable=False, default='EMAIL'),
        sa.Column('communicated_to_accounts', sa.Boolean(), nullable=False, default=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )

    # Create indexes for better performance
    op.create_index('ix_reports_labtest_id', 'reports', ['labtest_id'])
    op.create_index('ix_reports_final_status', 'reports', ['final_status'])
    op.create_index('ix_reports_created_at', 'reports', ['created_at'])


def downgrade():
    # Drop indexes
    op.drop_index('ix_reports_created_at', 'reports')
    op.drop_index('ix_reports_final_status', 'reports')
    op.drop_index('ix_reports_labtest_id', 'reports')
    
    # Drop table
    op.drop_table('reports')
    
    # Drop enums
    sa.Enum(name='finalstatus').drop(op.get_bind())
    sa.Enum(name='communicationstatus').drop(op.get_bind())
    sa.Enum(name='communicationchannel').drop(op.get_bind())
