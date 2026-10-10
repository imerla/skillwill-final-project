import { useState } from 'react'
import { useDocumentTitle } from '../shared/lib/useDocumentTitle'
import { Button } from '../shared/ui/Button/Button'
import { Input } from '../shared/ui/Input/Input'
import { PasswordInput } from '../shared/ui/PasswordInput/PasswordInput'
import { FormField } from '../shared/ui/FormField/FormField'
import { Alert } from '../shared/ui/Alert/Alert'
import { Spinner } from '../shared/ui/Spinner/Spinner'
import { Skeleton } from '../shared/ui/Skeleton/Skeleton'
import { Checkbox } from '../shared/ui/Checkbox/Checkbox'
import { Radio } from '../shared/ui/Radio/Radio'
import { Select } from '../shared/ui/Select/Select'
import { QuantityStepper } from '../shared/ui/QuantityStepper/QuantityStepper'
import { Pagination } from '../shared/ui/Pagination/Pagination'
import { Price } from '../shared/ui/Price/Price'
import { Rating } from '../shared/ui/Rating/Rating'
import { Badge } from '../shared/ui/Badge/Badge'
import { EmptyState } from '../shared/ui/EmptyState/EmptyState'
import { ErrorState } from '../shared/ui/ErrorState/ErrorState'
import { PageContainer } from '../shared/ui/PageContainer/PageContainer'
import './UiDemoPage.css'

export function UiDemoPage() {
  useDocumentTitle('UI')

  const [checkboxChecked, setCheckboxChecked] = useState(false)
  const [radioValue, setRadioValue] = useState('1')
  const [quantity, setQuantity] = useState(5)
  const [loading, setLoading] = useState(false)

  const handleLoadingToggle = () => {
    setLoading(!loading)
    if (!loading) {
      setTimeout(() => setLoading(false), 3000)
    }
  }

  return (
    <PageContainer size="page" as="main">
      <div className="ui-demo">
        <p className="ui-demo__instruction">ჰოვერის და ფოკუსის შესამოწმებლად გამოიყენეთ მაუსი და Tab</p>

        <section className="ui-demo__section">
          <h2 className="ui-demo__section-title">Button</h2>
          <div className="ui-demo__grid">
            <div>
              <h3>Primary</h3>
              <Button variant="primary">Primary</Button>
              <Button variant="primary" disabled>Disabled</Button>
            </div>
            <div>
              <h3>Secondary</h3>
              <Button variant="secondary">Secondary</Button>
              <Button variant="secondary" disabled>Disabled</Button>
            </div>
            <div>
              <h3>Danger</h3>
              <Button variant="danger">Danger</Button>
              <Button variant="danger" disabled>Disabled</Button>
            </div>
            <div>
              <h3>Loading</h3>
              <Button variant="primary" loading onClick={handleLoadingToggle}>
                {loading ? 'Loading...' : 'Click to load'}
              </Button>
            </div>
          </div>
        </section>

        <section className="ui-demo__section">
          <h2 className="ui-demo__section-title">Input & PasswordInput</h2>
          <div className="ui-demo__grid">
            <div>
              <h3>Input</h3>
              <Input type="email" placeholder="you@example.com" />
              <Input disabled placeholder="Disabled" />
              <Input aria-invalid="true" placeholder="Error state" />
            </div>
            <div>
              <h3>PasswordInput</h3>
              <PasswordInput placeholder="••••••••" />
              <PasswordInput disabled placeholder="Disabled" />
              <PasswordInput error placeholder="Error state" />
            </div>
          </div>
        </section>

        <section className="ui-demo__section">
          <h2 className="ui-demo__section-title">FormField & Alert</h2>
          <div className="ui-demo__grid">
            <div>
              <h3>FormField</h3>
              <FormField label="Label" hint="This is a hint">
                {(props) => <Input {...props} placeholder="Input" />}
              </FormField>
              <FormField label="Error" error="This is an error message">
                {(props) => <Input {...props} placeholder="Error input" />}
              </FormField>
            </div>
            <div>
              <h3>Alert</h3>
              <Alert variant="error" title="Error" message="Something went wrong" />
              <Alert variant="success" title="Success" message="Operation completed" />
              <Alert variant="info" title="Info" message="Information message" />
              <Alert variant="warning" title="Warning" message="Warning message" />
            </div>
          </div>
        </section>

        <section className="ui-demo__section">
          <h2 className="ui-demo__section-title">Spinner & Skeleton</h2>
          <div className="ui-demo__grid">
            <div>
              <h3>Spinner</h3>
              <Spinner size="sm" />
              <Spinner size="md" />
            </div>
            <div>
              <h3>Skeleton</h3>
              <Skeleton variant="text" style={{ width: '200px' }} />
              <Skeleton variant="rect" style={{ width: '100px', height: '60px' }} />
              <Skeleton variant="circle" style={{ width: '40px', height: '40px' }} />
            </div>
          </div>
        </section>

        <section className="ui-demo__section">
          <h2 className="ui-demo__section-title">Checkbox & Radio</h2>
          <div className="ui-demo__grid">
            <div>
              <h3>Checkbox</h3>
              <Checkbox label="Unchecked" count={5} checked={false} onChange={() => {}} />
              <Checkbox label="Checked" count={10} checked={checkboxChecked} onChange={(e) => setCheckboxChecked(e.target.checked)} />
              <Checkbox label="Disabled" disabled checked={false} onChange={() => {}} />
            </div>
            <div>
              <h3>Radio</h3>
              <Radio label="Option 1" name="demo" value="1" checked={radioValue === '1'} onChange={() => setRadioValue('1')} />
              <Radio label="Option 2" name="demo" value="2" checked={radioValue === '2'} onChange={() => setRadioValue('2')} />
              <Radio label="Disabled" name="demo" value="3" disabled onChange={() => {}} />
            </div>
          </div>
        </section>

        <section className="ui-demo__section">
          <h2 className="ui-demo__section-title">Select</h2>
          <div className="ui-demo__grid">
            <div>
              <h3>Select</h3>
              <Select label="Choose option">
                <option value="">Select...</option>
                <option value="1">Option 1</option>
                <option value="2">Option 2</option>
              </Select>
              <Select label="Disabled" disabled>
                <option value="">Select...</option>
              </Select>
              <Select label="Error" error="This field is required">
                <option value="">Select...</option>
              </Select>
            </div>
          </div>
        </section>

        <section className="ui-demo__section">
          <h2 className="ui-demo__section-title">QuantityStepper</h2>
          <div className="ui-demo__grid">
            <div>
              <h3>Quantity (value=1, min boundary)</h3>
              <QuantityStepper value={1} onChange={() => {}} min={1} max={99} />
            </div>
            <div>
              <h3>Quantity (value=99, max boundary)</h3>
              <QuantityStepper value={99} onChange={() => {}} min={1} max={99} />
            </div>
            <div>
              <h3>Quantity (normal)</h3>
              <QuantityStepper value={quantity} onChange={setQuantity} min={1} max={99} />
            </div>
            <div>
              <h3>Quantity (disabled)</h3>
              <QuantityStepper value={5} onChange={() => {}} disabled />
            </div>
          </div>
        </section>

        <section className="ui-demo__section">
          <h2 className="ui-demo__section-title">Pagination</h2>
          <div className="ui-demo__grid">
            <div>
              <h3>totalPages=1 (hidden)</h3>
              <Pagination page={1} totalPages={1} onPageChange={() => {}} />
            </div>
            <div>
              <h3>totalPages=5</h3>
              <Pagination page={3} totalPages={5} onPageChange={() => {}} />
            </div>
            <div>
              <h3>totalPages=20</h3>
              <Pagination page={10} totalPages={20} onPageChange={() => {}} />
            </div>
          </div>
        </section>

        <section className="ui-demo__section">
          <h2 className="ui-demo__section-title">Price</h2>
          <div className="ui-demo__grid">
            <div>
              <h3>Current only</h3>
              <Price value={99.99} />
            </div>
            <div>
              <h3>With old price</h3>
              <Price value={79.99} oldValue={99.99} />
            </div>
            <div>
              <h3>With discount</h3>
              <Price value={79.99} oldValue={99.99} discountPercent={20} />
            </div>
            <div>
              <h3>Sizes</h3>
              <Price value={99.99} size="sm" />
              <Price value={99.99} size="md" />
              <Price value={99.99} size="lg" />
            </div>
          </div>
        </section>

        <section className="ui-demo__section">
          <h2 className="ui-demo__section-title">Rating</h2>
          <div className="ui-demo__grid">
            <div>
              <h3>Without count</h3>
              <Rating value={4.5} />
            </div>
            <div>
              <h3>With count</h3>
              <Rating value={4.5} count={42} />
            </div>
          </div>
        </section>

        <section className="ui-demo__section">
          <h2 className="ui-demo__section-title">Badge</h2>
          <div className="ui-demo__grid">
            <div>
              <h3>Variants</h3>
              <Badge variant="neutral">Neutral</Badge>
              <Badge variant="accent">Accent</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="danger">Danger</Badge>
            </div>
          </div>
        </section>

        <section className="ui-demo__section">
          <h2 className="ui-demo__section-title">EmptyState & ErrorState</h2>
          <div className="ui-demo__grid">
            <div>
              <h3>EmptyState</h3>
              <EmptyState
                title="No items found"
                description="Try adjusting your filters or search terms"
                actionLabel="Clear filters"
                onAction={() => {}}
              />
            </div>
            <div>
              <h3>ErrorState</h3>
              <ErrorState
                actionLabel="Retry"
                onAction={() => {}}
              />
            </div>
          </div>
        </section>
      </div>
    </PageContainer>
  )
}
